import { Service } from 'typedi';
import {
  ValidationError,
  ReplayNotFoundError,
  ReplayParseError,
  ReplayPrivateError,
  ReplayTimeoutError,
  ReplayUpstreamError,
} from '../errors';

// The official Showdown archive — the only host that exposes a `{id}.json` API.
const SHOWDOWN_HOSTNAME = 'replay.pokemonshowdown.com';

/**
 * Hosts permitted as replay sources (SSRF allowlist).
 *
 * Everything other than SHOWDOWN_HOSTNAME is a third-party Showdown server that
 * publishes static `.html` replay pages instead of a JSON API — those are read
 * via the raw-log strategy (see fetchRawLog). Extend the list at deploy time
 * with `REPLAY_ALLOWED_HOSTS=host.one,host.two`.
 */
const DEFAULT_ALLOWED_HOSTS = [
  SHOWDOWN_HOSTNAME,
  'champsnatdex.dedyn.io',
  'sim.pokeathlon.com',
  'staraptorshowdown.com',
];

const FETCH_TIMEOUT_MS = 10_000;
const RETRY_BACKOFF_MS = 1_000;

// Third-party servers gate replay downloads behind a User-Agent check, so send
// one. Mirrors what the Porygon bot sends.
const USER_AGENT = 'DraftmonsReplayFetcher';

// Static Showdown replay exports embed the battle log verbatim in a
// <script type="text/plain" class="battle-log-data"> block.
const EMBEDDED_LOG_REGEX =
  /<script[^>]*class="battle-log-data"[^>]*>([\s\S]*?)<\/script>/i;

const REPLAY_EXTENSION_REGEX = /\.(json|log|html?)$/i;

export interface ShowdownReplayJson {
  id: string;
  format: string;
  players: string[];
  log: string;
  uploadtime: number;
  rating?: number;
}

/** How a given replay URL must be read. */
type ReplayStrategy = 'showdown-json' | 'raw-log';

interface ReplaySource {
  /** Normalized replay id, used for error messages and the parser's battle id. */
  id: string;
  strategy: ReplayStrategy;
  /** Endpoint serving the replay data — `{id}.json` on Showdown, `….log` elsewhere. */
  dataUrl: string;
  /** The replay page itself. Only read by the raw-log strategy's fallback. */
  pageUrl: string;
}

@Service()
export class ReplayFetcherService {
  private readonly allowedHosts: Set<string>;

  constructor() {
    const extra = (process.env.REPLAY_ALLOWED_HOSTS ?? '')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter((host) => host !== '');

    this.allowedHosts = new Set([...DEFAULT_ALLOWED_HOSTS, ...extra]);
  }

  /**
   * Validates a raw replay URL against a strict SSRF allowlist and returns
   * the normalized replay id.
   *
   * For Showdown URLs that is the path without the leading slash and without a
   * `.json`/`.log` suffix (e.g. "gen9natdexdraft-123"). For third-party hosts
   * it is the final path segment without its extension (e.g.
   * "27473_Cosinity_vs_Noremacris").
   *
   * Throws ValidationError synchronously for any invalid URL — before any
   * network call is made.
   */
  validateReplayUrl(raw: string): string {
    return this.parseReplayUrl(raw).id;
  }

  /**
   * Fetches a single replay and returns it in Showdown's JSON shape.
   *
   * - Validates the URL via parseReplayUrl (SSRF guard — before any network call).
   * - Showdown URLs are read from the `{id}.json` API.
   * - Third-party hosts (including replays whose URL ends in `.html`) are read
   *   with the raw-log strategy, and the JSON shape is synthesized from the
   *   log's own header lines.
   * - Uses AbortController + 10s timeout.
   * - Classifies fetch failures into distinct error classes.
   * - Retries exactly once on transient failures (ReplayTimeoutError, ReplayUpstreamError,
   *   raw network errors); never retries deterministic failures (404, 403, ValidationError).
   */
  async fetchReplay(url: string): Promise<ShowdownReplayJson> {
    const source = this.parseReplayUrl(url);

    const attempt = (): Promise<ShowdownReplayJson> =>
      source.strategy === 'showdown-json'
        ? this.fetchShowdownJson(source)
        : this.fetchRawLog(source);

    try {
      return await attempt();
    } catch (err) {
      if (this.isTransient(err)) {
        console.warn(
          `[replay-fetcher] Transient failure for ${source.id}, retrying in ${RETRY_BACKOFF_MS}ms`,
          err,
        );
        await this.sleep(RETRY_BACKOFF_MS);
        return await attempt();
      }
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // URL parsing / SSRF guard
  // ---------------------------------------------------------------------------

  private parseReplayUrl(raw: string): ReplaySource {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      throw new ValidationError(`Invalid replay URL — could not parse: ${raw}`);
    }

    if (parsed.protocol !== 'https:') {
      throw new ValidationError(
        `Replay URL must use HTTPS, got: ${parsed.protocol}`,
      );
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!this.allowedHosts.has(hostname)) {
      throw new ValidationError(
        `Replay URL host is not an allowed replay source: ${parsed.hostname}. ` +
          `Allowed hosts: ${[...this.allowedHosts].join(', ')}`,
      );
    }

    if (parsed.port !== '') {
      throw new ValidationError(
        `Replay URL must not include an explicit port, got: ${parsed.port}`,
      );
    }

    if (parsed.username !== '') {
      throw new ValidationError(
        `Replay URL must not include credentials, got username: ${parsed.username}`,
      );
    }

    const rawPath = parsed.pathname.replace(/\/+$/, '');

    // Strip repeatedly — a pasted `….html.log` URL carries two suffixes.
    let strippedPath = rawPath;
    while (REPLAY_EXTENSION_REGEX.test(strippedPath)) {
      strippedPath = strippedPath.replace(REPLAY_EXTENSION_REGEX, '');
    }

    const trimmedPath = strippedPath.replace(/^\//, '');

    if (!trimmedPath) {
      throw new ValidationError(
        `Replay URL must include a replay id (non-empty path), got: ${raw}`,
      );
    }

    const origin = parsed.origin;

    if (hostname === SHOWDOWN_HOSTNAME) {
      return {
        id: trimmedPath,
        strategy: 'showdown-json',
        dataUrl: `${origin}${strippedPath}.json`,
        pageUrl: `${origin}${strippedPath}`,
      };
    }

    // Third-party servers key their `.log` endpoint off the full filename — for a
    // `.html` replay only `….html.log` resolves, so append to the path as given
    // rather than to the extension-stripped path. This is what Porygon does.
    const segments = trimmedPath.split('/');

    return {
      id: segments[segments.length - 1],
      strategy: 'raw-log',
      dataUrl: /\.log$/i.test(rawPath) ? `${origin}${rawPath}` : `${origin}${rawPath}.log`,
      pageUrl: /\.html?$/i.test(rawPath)
        ? `${origin}${rawPath}`
        : `${origin}${strippedPath}.html`,
    };
  }

  // ---------------------------------------------------------------------------
  // Strategy: official Showdown JSON API
  // ---------------------------------------------------------------------------

  private async fetchShowdownJson(source: ReplaySource): Promise<ShowdownReplayJson> {
    const response = await this.request(source.dataUrl, source.id);
    return (await response.json()) as ShowdownReplayJson;
  }

  // ---------------------------------------------------------------------------
  // Strategy: raw log (third-party servers, incl. `.html` replay pages)
  // ---------------------------------------------------------------------------

  /**
   * Reads a replay from a server with no JSON API.
   *
   * Primary path (the technique the Porygon bot uses): append `.log` to the
   * replay URL — third-party Showdown servers serve the raw battle log there,
   * including for URLs that end in `.html`.
   *
   * Fallback: fetch the replay page itself and pull the log out of its embedded
   * `<script class="battle-log-data">` block, for hosts that don't serve `.log`.
   */
  private async fetchRawLog(source: ReplaySource): Promise<ShowdownReplayJson> {
    let log = await this.tryFetchLogEndpoint(source);

    if (log === null) {
      log = await this.fetchEmbeddedLog(source);
    }

    return this.buildJsonFromLog(source.id, log);
  }

  /**
   * Fetches the `….log` endpoint. Returns null — rather than throwing — when the
   * endpoint is missing or answers with something that isn't a battle log, so the
   * caller can fall back to scraping the replay page.
   */
  private async tryFetchLogEndpoint(source: ReplaySource): Promise<string | null> {
    let response: Response;
    try {
      response = await this.request(source.dataUrl, source.id);
    } catch (err) {
      if (err instanceof ReplayNotFoundError) {
        return null;
      }
      throw err;
    }

    const body = await response.text();
    const trimmed = body.trimStart();

    // Some servers answer an unknown path with an empty body or a 200 HTML page.
    return trimmed === '' || trimmed.startsWith('<') ? null : body;
  }

  private async fetchEmbeddedLog(source: ReplaySource): Promise<string> {
    const response = await this.request(source.pageUrl, source.id);
    const html = await response.text();
    const match = EMBEDDED_LOG_REGEX.exec(html);

    if (!match) {
      throw new ReplayParseError(
        source.id,
        `Could not read a battle log from ${source.pageUrl} — the page has no ` +
          `.log endpoint and no embedded replay data.`,
      );
    }

    return this.decodeHtmlEntities(match[1]).trim();
  }

  /**
   * Rebuilds Showdown's JSON shape from a raw log's own header lines:
   * `|player|pN|<name>|…`, `|tier|<format>` and the first `|t:|<unix>`.
   */
  private buildJsonFromLog(id: string, log: string): ShowdownReplayJson {
    const players: string[] = [];
    let format = '';
    let uploadtime = 0;

    for (const line of log.split('\n')) {
      // |player| also reappears mid-battle for avatar/name changes — only the
      // first p1/p2 pair describes the participants.
      if (line.startsWith('|player|')) {
        const name = line.split('|')[3];
        if (name && players.length < 2) {
          players.push(name);
        }
      } else if (line.startsWith('|tier|')) {
        format = line.split('|')[2] ?? '';
      } else if (uploadtime === 0 && line.startsWith('|t:|')) {
        uploadtime = parseInt(line.split('|')[2] ?? '', 10) || 0;
      }
    }

    if (players.length < 2) {
      throw new ReplayParseError(
        id,
        `Replay log for ${id} did not contain two players — the URL may not be a Showdown replay.`,
      );
    }

    return { id, format, players, log, uploadtime };
  }

  private decodeHtmlEntities(value: string): string {
    return value
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }

  // ---------------------------------------------------------------------------
  // Shared request plumbing
  // ---------------------------------------------------------------------------

  /**
   * Performs one timeout-guarded GET and classifies non-2xx responses into the
   * replay error hierarchy. Returns the successful Response for the caller to
   * read as JSON or text.
   */
  private async request(endpoint: string, id: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT },
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new ReplayTimeoutError(id);
      }
      // Raw network error (DNS failure, connection refused, etc.)
      throw err;
    } finally {
      clearTimeout(timer);
    }

    if (response.ok) {
      this.assertNotRedirectedOffAllowlist(response, endpoint);
      return response;
    }

    if (response.status === 404) {
      throw new ReplayNotFoundError(id);
    }

    if (response.status === 403) {
      throw new ReplayPrivateError(id);
    }

    if (response.status >= 500) {
      throw new ReplayUpstreamError(id, response.status);
    }

    // Other 4xx (410 Gone, 400 Bad Request, etc.) — treat as not found
    throw new ReplayNotFoundError(id);
  }

  /**
   * fetch follows redirects, so an allowlisted host could hand us off to one
   * that isn't. Re-check the final URL before the body is read.
   */
  private assertNotRedirectedOffAllowlist(response: Response, endpoint: string): void {
    if (!response.url) {
      return;
    }

    let finalHost: string;
    try {
      finalHost = new URL(response.url).hostname.toLowerCase();
    } catch {
      return;
    }

    if (!this.allowedHosts.has(finalHost)) {
      throw new ValidationError(
        `Replay request for ${endpoint} was redirected to a host that is not an ` +
          `allowed replay source: ${finalHost}`,
      );
    }
  }

  private isTransient(err: unknown): boolean {
    return (
      err instanceof ReplayTimeoutError ||
      err instanceof ReplayUpstreamError ||
      (err instanceof Error &&
        err.name !== 'AbortError' &&
        !(err instanceof ReplayNotFoundError) &&
        !(err instanceof ReplayPrivateError) &&
        !(err instanceof ReplayParseError) &&
        !(err instanceof ValidationError))
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
