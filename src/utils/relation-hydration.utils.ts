import { FindOptionsRelations, FindOptionsWhere, In, Repository } from 'typeorm';
import { BaseApplicationEntity } from '../entities/base-application.entity';

/**
 * Two-phase relation loading (the Phase 2 counterpart to Phase 1's
 * `relationLoadStrategy: 'query'` on `BaseService`).
 *
 * The custom `search()` methods build their filter/sort/pagination via a
 * `SelectQueryBuilder`, which has no `relationLoadStrategy` option — hydrating
 * to-many relations there with `leftJoinAndSelect` produces a Cartesian-product
 * row blow-up that Neon bills as data transfer (Postgres → Railway). Instead,
 * phase 1 selects just the page's entity ids (row-safe), and this function
 * re-loads that page with its full relation graph via `find(..., { relationLoadStrategy:
 * 'query' })`, which issues a separate, non-multiplying query per to-many relation.
 *
 * `In(ids)` does not preserve the page's sort order, so results are re-sorted to
 * match the original `ids` order. Nested relation array order may differ from a
 * join-based load — callers that depend on a specific nested order must sort it
 * themselves (see the spec's Edge Cases).
 */
export async function hydrateRelations<T extends BaseApplicationEntity>(
  repository: Repository<T>,
  ids: number[],
  relations: FindOptionsRelations<T> | undefined,
): Promise<T[]> {
  if (ids.length === 0) return [];

  const hydrated = await repository.find({
    where: { id: In(ids) } as FindOptionsWhere<T>,
    relations,
    relationLoadStrategy: 'query',
  });

  const byId = new Map(hydrated.map((entity) => [entity.id, entity]));
  return ids.map((id) => byId.get(id)).filter((entity): entity is T => !!entity);
}
