import { Service } from 'typedi';
import { ReplayTracker, type ReplayAnalysis } from '../utils/replay-parser';
import { ReplayParseError } from '../errors';

const RANDOMS_MESSAGE = "Random battles aren't supported — draft replays only";

@Service()
export class ReplayParserService {
  /**
   * Runs the replay parser for a single replay log and guards on the parser's
   * error field before returning any result data.
   *
   * The parser never throws — it sets `result.error` on failure. This method
   * is the sole guarded entry point (PARSE-05): it checks `result.error` FIRST
   * and throws ReplayParseError (422) when the parser signals a failure, so no
   * downstream caller can ever access `result.info.*` or `result.players.*`
   * without passing the guard.
   *
   * @param replayId - The normalized replay id (e.g. "gen9natdexdraft-123").
   * @param log      - The raw replay log string.
   * @returns The ReplayAnalysis, guaranteed to have error === undefined.
   * @throws ReplayParseError (422) if the parser sets result.error.
   */
  async parse(replayId: string, log: string): Promise<ReplayAnalysis> {
    const tracker = new ReplayTracker(replayId);
    const result = await tracker.track(log);

    // PARSE-05 guard: check error BEFORE any access to result.info or result.players.
    if (result.error) {
      if (result.error.toLowerCase().includes('random')) {
        throw new ReplayParseError(replayId, RANDOMS_MESSAGE);
      }
      throw new ReplayParseError(replayId, result.error);
    }

    return result;
  }
}
