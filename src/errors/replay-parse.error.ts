import { BaseError } from './base.error';

export class ReplayParseError extends BaseError {
  constructor(replayId: string, detail: string) {
    super(detail, 422, 'REPLAY_PARSE_ERROR');
    void replayId;
  }
}
