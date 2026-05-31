import { Service } from 'typedi';
import {
  ValidationError,
  ReplayNotFoundError,
  ReplayPrivateError,
  ReplayTimeoutError,
  ReplayUpstreamError,
} from '../errors';

const ALLOWED_HOSTNAME = 'replay.pokemonshowdown.com';
const FETCH_TIMEOUT_MS = 10_000;
const RETRY_BACKOFF_MS = 1_000;

export interface ShowdownReplayJson {
  id: string;
  format: string;
  players: string[];
  log: string;
  uploadtime: number;
  rating?: number;
}

@Service()
export class ReplayFetcherService {
  /**
   * Validates a raw replay URL against a strict SSRF allowlist and returns
   * the normalized replay id (path without leading slash, .json/.log suffix
   * and query string stripped).
   *
   * Throws ValidationError synchronously for any invalid URL — before any
   * network call is made.
   */
  validateReplayUrl(raw: string): string {
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

    if (parsed.hostname !== ALLOWED_HOSTNAME) {
      throw new ValidationError(
        `Replay URL must be on ${ALLOWED_HOSTNAME}, got: ${parsed.hostname}`,
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

    const replayId = parsed.pathname
      .replace(/\.(json|log)$/, '')
      .replace(/^\//, '');

    if (!replayId) {
      throw new ValidationError(
        `Replay URL must include a replay id (non-empty path), got: ${raw}`,
      );
    }

    return replayId;
  }

  /**
   * Fetches a single replay's JSON from Showdown.
   *
   * - Validates the URL via validateReplayUrl (SSRF guard — before any network call).
   * - Uses AbortController + 10s timeout.
   * - Classifies fetch failures into distinct error classes.
   * - Retries exactly once on transient failures (ReplayTimeoutError, ReplayUpstreamError,
   *   raw network errors); never retries deterministic failures (404, 403, ValidationError).
   */
  async fetchReplay(url: string): Promise<ShowdownReplayJson> {
    const id = this.validateReplayUrl(url);
    const endpoint = `https://${ALLOWED_HOSTNAME}/${id}.json`;

    try {
      return await this.attemptFetch(endpoint, id);
    } catch (err) {
      if (this.isTransient(err)) {
        console.warn(`[replay-fetcher] Transient failure for ${id}, retrying in ${RETRY_BACKOFF_MS}ms`, err);
        await this.sleep(RETRY_BACKOFF_MS);
        return await this.attemptFetch(endpoint, id);
      }
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async attemptFetch(endpoint: string, id: string): Promise<ShowdownReplayJson> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(endpoint, { signal: controller.signal });
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
      return response.json() as Promise<ShowdownReplayJson>;
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

  private isTransient(err: unknown): boolean {
    return (
      err instanceof ReplayTimeoutError ||
      err instanceof ReplayUpstreamError ||
      (err instanceof Error &&
        err.name !== 'AbortError' &&
        !(err instanceof ReplayNotFoundError) &&
        !(err instanceof ReplayPrivateError) &&
        !(err instanceof ValidationError))
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
