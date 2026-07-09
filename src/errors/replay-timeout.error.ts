import { BaseError } from './base.error';

export class ReplayTimeoutError extends BaseError {
  constructor(replayId: string) {
    super(
      `Showdown did not respond in time — try again (${replayId})`,
      504,
      'REPLAY_TIMEOUT',
    );
  }
}
