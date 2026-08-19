import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/error.utils';
import { validateDto } from '../middleware/validation.middleware';
import { MatchAnalysisService } from '../services/match-analysis.service';
import { AnalyzeGameInputDto, AnalyzeInputDto } from '../dtos/match-analysis.dto';
import { SubmitInputDto } from '../dtos/submit-input.dto';
import { ManualSubmitInputDto } from '../dtos/manual-submit-input.dto';

/**
 * @swagger
 * tags:
 *   - name: MatchUpload
 *     description: Two-step replay upload pipeline — analyze a set of replays into a preview, then submit the confirmed result.
 *
 * components:
 *   schemas:
 *     SubmitStatInput:
 *       type: object
 *       required:
 *         - seasonPokemonId
 *         - directKills
 *         - indirectKills
 *         - deaths
 *       properties:
 *         seasonPokemonId:
 *           type: integer
 *           description: Resolved SeasonPokemon id for the season.
 *           example: 42
 *         directKills:
 *           type: integer
 *           minimum: 0
 *           example: 3
 *         indirectKills:
 *           type: integer
 *           minimum: 0
 *           example: 1
 *         deaths:
 *           type: integer
 *           minimum: 0
 *           example: 2
 *     SubmitGameInput:
 *       type: object
 *       required:
 *         - gameNumber
 *         - replayLink
 *         - winningTeamId
 *         - losingTeamId
 *         - differential
 *         - stats
 *       properties:
 *         gameNumber:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         replayLink:
 *           type: string
 *           format: uri
 *           example: "https://replay.pokemonshowdown.com/gen9draft-123456789"
 *         winningTeamId:
 *           type: integer
 *           description: Team id of the game winner (must be a participant of the match).
 *           example: 7
 *         losingTeamId:
 *           type: integer
 *           description: Team id of the game loser (must be a participant of the match).
 *           example: 9
 *         differential:
 *           type: integer
 *           minimum: 0
 *           description: Surviving Pokémon differential for the winner.
 *           example: 2
 *         stats:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubmitStatInput'
 *     SubmitInput:
 *       type: object
 *       required:
 *         - seasonId
 *         - matchId
 *         - confirmOverwrite
 *         - games
 *       properties:
 *         seasonId:
 *           type: integer
 *           example: 3
 *         matchId:
 *           type: integer
 *           description: Existing match the games are recorded against.
 *           example: 15
 *         confirmOverwrite:
 *           type: boolean
 *           description: Must be true to overwrite a match that already has games recorded (D-02/D-03).
 *           example: false
 *         games:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubmitGameInput'
 *     ManualStatInput:
 *       type: object
 *       required:
 *         - seasonPokemonId
 *         - directKills
 *         - indirectKills
 *         - deaths
 *       properties:
 *         seasonPokemonId:
 *           type: integer
 *           description: SeasonPokemon id from the season's draft pool.
 *           example: 42
 *         directKills:
 *           type: integer
 *           minimum: 0
 *           example: 2
 *         indirectKills:
 *           type: integer
 *           minimum: 0
 *           example: 0
 *         deaths:
 *           type: integer
 *           minimum: 0
 *           example: 1
 *     ManualGameInput:
 *       type: object
 *       required:
 *         - winningTeamId
 *         - losingTeamId
 *       properties:
 *         winningTeamId:
 *           type: integer
 *           description: Team id of the game winner (must be a participant of the match).
 *           example: 7
 *         losingTeamId:
 *           type: integer
 *           description: Team id of the game loser (must be a participant of the match).
 *           example: 9
 *         differential:
 *           type: integer
 *           minimum: 0
 *           description: Surviving-Pokémon differential for the winner. Defaults to 0 when omitted.
 *           example: 2
 *         replayLink:
 *           type: string
 *           format: uri
 *           description: >
 *             Optional — a manually recorded game may have no replay at all. Must be globally
 *             unique when present (same constraint as the replay flow).
 *           example: "https://replay.pokemonshowdown.com/gen9draft-123456789"
 *         stats:
 *           type: array
 *           description: Optional per-Pokémon stats. No minimum — omit entirely for a game with no recorded stats.
 *           items:
 *             $ref: '#/components/schemas/ManualStatInput'
 *     ManualSubmitInput:
 *       type: object
 *       required:
 *         - matchId
 *         - resultSource
 *         - confirmOverwrite
 *         - winningTeamId
 *         - losingTeamId
 *         - games
 *       properties:
 *         matchId:
 *           type: integer
 *           description: Existing match the result is recorded against. Must belong to :leagueId.
 *           example: 15
 *         resultSource:
 *           type: string
 *           enum: [MANUAL, FORFEIT]
 *           description: >
 *             MANUAL — games were actually played; each row may carry its own replay link and stats.
 *             FORFEIT — clean sweep with no play; replayLink/differential/stats on each row are
 *             ignored and placeholders are written with differential 0 and no stats.
 *           example: MANUAL
 *         confirmOverwrite:
 *           type: boolean
 *           description: Must be true to overwrite a match that already has games recorded.
 *           example: false
 *         winningTeamId:
 *           type: integer
 *           description: Match winner. Stated explicitly because a FORFEIT can have zero games.
 *           example: 7
 *         losingTeamId:
 *           type: integer
 *           example: 9
 *         games:
 *           type: array
 *           description: >
 *             gameNumber is assigned from array order. May be empty for a FORFEIT with no score;
 *             MANUAL requires at least one game with a strict-majority winner matching winningTeamId.
 *           items:
 *             $ref: '#/components/schemas/ManualGameInput'
 */

// Does not extend BaseController — this is a bespoke action controller, not a CRUD resource.
export class MatchUploadController {
  public router = Router({ mergeParams: true });

  constructor(private matchAnalysisService: MatchAnalysisService) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/analyze', validateDto(AnalyzeInputDto), asyncHandler(this.analyze));
    this.router.post('/submit', validateDto(SubmitInputDto), asyncHandler(this.submit));
    this.router.post(
      '/analyze-game',
      validateDto(AnalyzeGameInputDto),
      asyncHandler(this.analyzeGame),
    );
    this.router.post(
      '/submit-manual',
      validateDto(ManualSubmitInputDto),
      asyncHandler(this.submitManual),
    );
  }

  /**
   * @swagger
   * /api/league/{leagueId}/match-upload/analyze:
   *   post:
   *     tags:
   *       - MatchUpload
   *     summary: Analyze a set of replays into a match preview
   *     description: >
   *       Thin wrapper over the analysis pipeline. Fetches and parses the given replay URLs,
   *       resolves players, Pokémon, and the target match, and returns a preview with any
   *       field-level errors accumulated in the `errors` array (never thrown).
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: leagueId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - seasonId
   *               - replayUrls
   *             properties:
   *               seasonId:
   *                 type: integer
   *                 example: 3
   *               replayUrls:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: uri
   *                 example:
   *                   - "https://replay.pokemonshowdown.com/gen9draft-123456789"
   *                   - "https://replay.pokemonshowdown.com/gen9draft-987654321"
   *               playerOverrides:
   *                 type: array
   *                 description: >
   *                   Optional direct team picks for players that could not be resolved via
   *                   Showdown-username matching (including unassigned/ownerless teams).
   *                   Re-run analyze with these to recompute match lookup and stat resolution
   *                   against the chosen team(s).
   *                 items:
   *                   type: object
   *                   required:
   *                     - playerIndex
   *                     - teamId
   *                   properties:
   *                     playerIndex:
   *                       type: integer
   *                       description: 0 or 1 — index into the canonical player pair.
   *                       example: 1
   *                     teamId:
   *                       type: integer
   *                       example: 42
   *     responses:
   *       200:
   *         description: Match preview (may contain field-level errors in `errors`).
   *       400:
   *         description: Invalid input data.
   *       401:
   *         description: User not authenticated.
   *       403:
   *         description: User is not a moderator of this league.
   *       404:
   *         description: Referenced resource not found.
   */
  private analyze = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as AnalyzeInputDto;
    const preview = await this.matchAnalysisService.analyze(
      body.seasonId,
      body.replayUrls,
      body.playerOverrides,
    );
    res.json(preview);
  };

  /**
   * @swagger
   * /api/league/{leagueId}/match-upload/submit:
   *   post:
   *     tags:
   *       - MatchUpload
   *     summary: Persist a confirmed match result
   *     description: >
   *       Re-validates referenced IDs against the live database, applies structural sanity
   *       checks, detects duplicate replay links, enforces overwrite protection, and persists
   *       games, game-stats, and the match winner/loser atomically.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: leagueId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SubmitInput'
   *     responses:
   *       201:
   *         description: Match result persisted.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 matchId:
   *                   type: integer
   *                   example: 15
   *                 games:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                         example: 101
   *                       gameNumber:
   *                         type: integer
   *                         example: 1
   *                       replayLink:
   *                         type: string
   *                         example: "https://replay.pokemonshowdown.com/gen9draft-123456789"
   *       400:
   *         description: Invalid input or failed structural re-validation.
   *       401:
   *         description: User not authenticated.
   *       403:
   *         description: User is not a moderator of this league.
   *       404:
   *         description: Match, season, or referenced entity not found.
   *       409:
   *         description: >
   *           Conflict — duplicate replay link, or the match already has games recorded and
   *           `confirmOverwrite` was not set. The response body carries structured `detail`.
   */
  private submit = async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.leagueId, 10);
    const body = req.body as SubmitInputDto;
    const result = await this.matchAnalysisService.submit(leagueId, body);
    res.status(201).json(result);
  };

  /**
   * @swagger
   * /api/league/{leagueId}/match-upload/analyze-game:
   *   post:
   *     tags:
   *       - MatchUpload
   *     summary: Analyze a single replay against a known match
   *     description: >
   *       Narrower counterpart to /analyze for the manual-entry flow. The target match is already
   *       known, so one replay is fetched and parsed and its two players are resolved against that
   *       match's two teams (via each team owner's showdownUsername, or a playerOverrides pick).
   *       Returns the resolved winner/differential/stats for that single game so the moderator can
   *       pre-fill one manual game row. Never writes to the database.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: leagueId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - matchId
   *               - replayUrl
   *             properties:
   *               matchId:
   *                 type: integer
   *                 description: Existing match the replay belongs to. Must belong to :leagueId.
   *                 example: 15
   *               replayUrl:
   *                 type: string
   *                 format: uri
   *                 example: "https://replay.pokemonshowdown.com/gen9draft-123456789"
   *               playerOverrides:
   *                 type: array
   *                 description: >
   *                   Optional direct team picks for players that could not be resolved via
   *                   Showdown-username matching. Scoped to the match's two teams.
   *                 items:
   *                   type: object
   *                   required:
   *                     - playerIndex
   *                     - teamId
   *                   properties:
   *                     playerIndex:
   *                       type: integer
   *                       description: 0 or 1 — index into the replay's player pair.
   *                       example: 1
   *                     teamId:
   *                       type: integer
   *                       example: 42
   *     responses:
   *       200:
   *         description: >
   *           Single-game preview. `game` is null when the replay could not be fetched or parsed;
   *           all recoverable problems are listed in `errors` with the usual PreviewErrorCode values.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 matchId:
   *                   type: integer
   *                   example: 15
   *                 replayUrl:
   *                   type: string
   *                   example: "https://replay.pokemonshowdown.com/gen9draft-123456789"
   *                 players:
   *                   type: array
   *                   items:
   *                     type: object
   *                 game:
   *                   type: object
   *                   nullable: true
   *                 errors:
   *                   type: array
   *                   items:
   *                     type: object
   *       400:
   *         description: Invalid input data.
   *       401:
   *         description: User not authenticated.
   *       403:
   *         description: User is not a moderator of this league, or the match belongs to another league.
   *       404:
   *         description: Match or season not found.
   */
  private analyzeGame = async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.leagueId, 10);
    const body = req.body as AnalyzeGameInputDto;
    const preview = await this.matchAnalysisService.analyzeGame(leagueId, body);
    res.json(preview);
  };

  /**
   * @swagger
   * /api/league/{leagueId}/match-upload/submit-manual:
   *   post:
   *     tags:
   *       - MatchUpload
   *     summary: Persist a manually entered or forfeited match result
   *     description: >
   *       Records a match result without requiring a replay per game — for matches that were played
   *       but never saved, or decided by forfeit. Writes real Game/GameStat rows so standings read
   *       exactly as they do for replay results. Enforces the same strict-majority winner rule,
   *       duplicate-replay-link check, and overwrite protection as /submit.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: leagueId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ManualSubmitInput'
   *     responses:
   *       201:
   *         description: Match result persisted.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 matchId:
   *                   type: integer
   *                   example: 15
   *                 resultSource:
   *                   type: string
   *                   enum: [MANUAL, FORFEIT]
   *                   example: FORFEIT
   *                 winningTeamId:
   *                   type: integer
   *                   example: 7
   *                 losingTeamId:
   *                   type: integer
   *                   example: 9
   *                 games:
   *                   type: array
   *                   description: Empty for a forfeit submitted with no score.
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                         example: 101
   *                       gameNumber:
   *                         type: integer
   *                         example: 1
   *                       replayLink:
   *                         type: string
   *                         nullable: true
   *                         example: null
   *       400:
   *         description: >
   *           Invalid input — winner/loser not participants of the match, a MANUAL set with no
   *           strict-majority winner, a FORFEIT that isn't a clean sweep, or more games than the
   *           season allows.
   *       401:
   *         description: User not authenticated.
   *       403:
   *         description: User is not a moderator of this league, or the match belongs to another league.
   *       404:
   *         description: Match, season, or referenced SeasonPokemon not found.
   *       409:
   *         description: >
   *           Conflict — duplicate replay link, or the match already has games recorded and
   *           `confirmOverwrite` was not set. The response body carries structured `detail`.
   */
  private submitManual = async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.leagueId, 10);
    const body = req.body as ManualSubmitInputDto;
    const result = await this.matchAnalysisService.submitManual(leagueId, body);
    res.status(201).json(result);
  };
}
