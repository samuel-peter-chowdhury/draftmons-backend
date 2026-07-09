import { BaseError } from './base.error';

export class ReplayUpstreamError extends BaseError {
  constructor(replayId: string, status: number) {
    super(
      `Showdown returned an error (${status}) — try again`,
      502,
      'REPLAY_UPSTREAM',
    );
    void replayId;
  }
}
