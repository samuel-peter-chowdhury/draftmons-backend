import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/error.utils';
import { validateDto } from '../middleware/validation.middleware';
import { MatchAnalysisService } from '../services/match-analysis.service';
import { AnalyzeInputDto } from '../dtos/match-analysis.dto';
import { SubmitInputDto } from '../dtos/submit-input.dto';

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
    const preview = await this.matchAnalysisService.analyze(body.seasonId, body.replayUrls);
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
}
