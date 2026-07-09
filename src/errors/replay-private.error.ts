import { BaseError } from './base.error';

export class ReplayPrivateError extends BaseError {
  constructor(replayId: string) {
    super(
      `This replay is private or unavailable (${replayId})`,
      403,
      'REPLAY_PRIVATE',
    );
  }
}
