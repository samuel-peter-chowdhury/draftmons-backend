import 'reflect-metadata';
import { Container } from 'typedi';
import { ReplayTracker } from '../utils/replay-parser';
import { ReplayAnalysis } from '../utils/replay-parser';
import { ReplayParseError } from '../errors';
import { ReplayParserService } from './replay-parser.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SUCCESS_ANALYSIS: ReplayAnalysis = {
  players: {
    ash: {
      ps: 'ash',
      kills: { pikachu: { direct: 1, passive: 0 } },
      deaths: { pikachu: 0 },
    },
  },
  playerNames: ['ash', 'misty'],
  info: {
    replay: 'https://replay.pokemonshowdown.com/gen9natdexdraft-123',
    history: '',
    turns: 42,
    winner: 'ash',
    loser: 'misty',
    rules: {
      recoil: 'D',
      suicide: 'D',
      abilityitem: 'P',
      selfteam: 'N',
      db: 'P',
      forfeit: 'N',
    },
    result: '1-0',
    battleId: 'gen9natdexdraft-123',
  },
  error: undefined,
};

const GENERIC_ERROR_ANALYSIS: ReplayAnalysis = {
  ...SUCCESS_ANALYSIS,
  error: 'Unexpected end of log',
};

const RANDOMS_ERROR_ANALYSIS: ReplayAnalysis = {
  ...SUCCESS_ANALYSIS,
  error: 'Random battle detected — cannot parse',
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let service: ReplayParserService;

beforeEach(() => {
  Container.reset();
  service = new ReplayParserService();
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// parse() — result.error guard
// ---------------------------------------------------------------------------

describe('ReplayParserService.parse', () => {
  it('throws ReplayParseError (422) when parser sets result.error (generic failure)', async () => {
    jest.spyOn(ReplayTracker.prototype, 'track').mockResolvedValue(GENERIC_ERROR_ANALYSIS);

    await expect(service.parse('gen9natdexdraft-123', '|start')).rejects.toThrow(ReplayParseError);
    await expect(service.parse('gen9natdexdraft-123', '|start')).rejects.toMatchObject({
      statusCode: 422,
      errorCode: 'REPLAY_PARSE_ERROR',
    });
  });

  it('throws ReplayParseError with the specific randoms message when error contains "random"', async () => {
    jest.spyOn(ReplayTracker.prototype, 'track').mockResolvedValue(RANDOMS_ERROR_ANALYSIS);

    await expect(service.parse('gen9natdexdraft-123', '|start')).rejects.toMatchObject({
      statusCode: 422,
      errorCode: 'REPLAY_PARSE_ERROR',
      message: "Random battles aren't supported — draft replays only",
    });
  });

  it('returns the ReplayAnalysis unchanged when error is undefined', async () => {
    jest.spyOn(ReplayTracker.prototype, 'track').mockResolvedValue(SUCCESS_ANALYSIS);

    const result = await service.parse('gen9natdexdraft-123', '|start');

    expect(result).toBe(SUCCESS_ANALYSIS);
    expect(result.info.winner).toBe('ash');
    expect(result.players).toBeDefined();
  });
});
