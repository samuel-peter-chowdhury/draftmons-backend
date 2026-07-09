import { BaseError } from './base.error';

export class ReplayNotFoundError extends BaseError {
  constructor(replayId: string) {
    super(
      `Replay not found — check the link or ensure the replay is public (${replayId})`,
      404,
      'REPLAY_NOT_FOUND',
    );
  }
}
