import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/error.utils';
import { validateDto } from '../middleware/validation.middleware';
import { SeasonPokemonService } from '../services/season-pokemon.service';
import { BulkUpsertInputDto } from '../dtos/season-pokemon-bulk.dto';

/**
 * @swagger
 * tags:
 *   - name: SeasonPokemonBulk
 *     description: Transactional bulk create-or-update for a season's tier list (CSV import backing endpoint).
 *
 * components:
 *   schemas:
 *     BulkUpsertEntryInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Pokémon name, matched case-insensitively (whitespace trimmed) within the season's generation.
 *           example: "Pikachu"
 *         pointValue:
 *           type: integer
 *           description: >
 *             Tier point value, 0..season.maxPointValue inclusive. 0 means "Unassigned".
 *             Missing/blank is a per-entry validation failure, not a whole-request 400.
 *           example: 10
 *     BulkUpsertInput:
 *       type: object
 *       required:
 *         - seasonId
 *         - entries
 *       properties:
 *         seasonId:
 *           type: integer
 *           description: Season the entries belong to. Must belong to the path :leagueId.
 *           example: 3
 *         entries:
 *           type: array
 *           maxItems: 2000
 *           items:
 *             $ref: '#/components/schemas/BulkUpsertEntryInput'
 *     BulkUpsertEntryResult:
 *       type: object
 *       required:
 *         - name
 *         - status
 *       properties:
 *         name:
 *           type: string
 *           example: "Charizard"
 *         pointValue:
 *           type: integer
 *           nullable: true
 *           example: 15
 *         status:
 *           type: string
 *           enum: [success, failure]
 *           example: success
 *         code:
 *           type: string
 *           enum: [POKEMON_NOT_FOUND, INVALID_POINT_VALUE]
 *           description: Present only when status is "failure".
 *           example: POKEMON_NOT_FOUND
 *         message:
 *           type: string
 *           description: Present only when status is "failure".
 *           example: 'Pokémon "Missingno" was not found in this season''s generation.'
 */

// Does not extend BaseController — this is a bespoke action controller, not a CRUD resource.
export class SeasonPokemonBulkController {
  public router = Router({ mergeParams: true });

  constructor(private seasonPokemonService: SeasonPokemonService) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/', validateDto(BulkUpsertInputDto), asyncHandler(this.bulkUpsert));
  }

  /**
   * @swagger
   * /api/league/{leagueId}/season-pokemon-bulk:
   *   post:
   *     tags:
   *       - SeasonPokemonBulk
   *     summary: Bulk create-or-update season-pokemon entries
   *     description: >
   *       Validates each (name, pointValue) entry independently and creates-or-updates the
   *       corresponding SeasonPokemon row in a single transaction. One invalid entry never
   *       blocks the others — the response is always 200 with a per-entry result array,
   *       parallel in order and length to the request's `entries`.
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
   *             $ref: '#/components/schemas/BulkUpsertInput'
   *     responses:
   *       200:
   *         description: Per-entry result array (may include failures alongside successes).
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/BulkUpsertEntryResult'
   *       400:
   *         description: Invalid request shape.
   *       401:
   *         description: User not authenticated.
   *       403:
   *         description: User is not a moderator of this league.
   *       404:
   *         description: Season not found.
   */
  private bulkUpsert = async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.leagueId, 10);
    const body = req.body as BulkUpsertInputDto;
    const result = await this.seasonPokemonService.bulkUpsert(leagueId, body);
    res.status(200).json(result);
  };
}
