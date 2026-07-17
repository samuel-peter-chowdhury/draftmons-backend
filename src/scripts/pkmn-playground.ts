/**
 * @pkmn/dex + @pkmn/mods "Champions" playground
 * ---------------------------------------------
 * A scratchpad for exploring the Pokémon Champions data exposed by @pkmn/mods
 * and comparing it against the base Generation 9 data from @pkmn/dex.
 *
 * Champions is NOT a numbered generation. In @pkmn (mirroring Pokémon
 * Showdown) it is a "mod" — an overlay applied on top of gen 9 via
 * Dex.mod('champions', <modData>). See @pkmn/mods README.
 *
 * Run with:  npx ts-node src/scripts/pkmn-playground.ts
 *
 * This does NOT touch the database. It only reads bundled dex data.
 * Edit / add probes freely — this file is meant to be hacked on.
 */
import { Dex, ID, ModData } from '@pkmn/dex';

const BASE_GEN = 9;

function hr(title: string): void {
  console.log(`\n${'='.repeat(72)}\n${title}\n${'='.repeat(72)}`);
}

async function main(): Promise<void> {
  // Base gen 9 dex (what admin.service already seeds as generation id 10).
  const base = Dex.forGen(BASE_GEN as any);

  // Champions modded dex — the overlay we want to explore for seeding as gen 11.
  const championsData = (await import('@pkmn/mods/champions')) as unknown as ModData;
  const champ = Dex.mod('champions' as ID, championsData);

  hr('0. Sanity — the champions mod loaded');
  console.log(`  base   : gen=${base.gen}, modid=${(base as any).modid}`);
  console.log(`  champ  : gen=${champ.gen}, modid=${(champ as any).modid}`);

  // --- Counts across every data table we care about for seeding ---
  hr('1. Table sizes: champions vs base gen 9');
  const tables: Array<[string, () => readonly any[], () => readonly any[]]> = [
    ['species', () => champ.species.all(), () => base.species.all()],
    ['abilities', () => champ.abilities.all(), () => base.abilities.all()],
    ['moves', () => champ.moves.all(), () => base.moves.all()],
    ['items', () => champ.items.all(), () => base.items.all()],
    ['natures', () => champ.natures.all(), () => base.natures.all()],
    ['types', () => champ.types.all(), () => base.types.all()],
  ];
  console.log(`  ${'table'.padEnd(12)} ${'champions'.padStart(10)} ${'base g9'.padStart(10)}`);
  for (const [name, c, b] of tables) {
    console.log(`  ${name.padEnd(12)} ${String(c().length).padStart(10)} ${String(b().length).padStart(10)}`);
  }

  // --- isNonstandard distribution in champions species ---
  hr('2. isNonstandard tags in champions species');
  const counts = new Map<string, number>();
  for (const s of champ.species.all()) {
    const key = String((s as any).isNonstandard ?? 'null');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const [tag, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tag.padEnd(14)} ${n}`);
  }

  // --- What is actually DIFFERENT about champions vs base gen 9? ---
  // The champions mod keeps gen-9 stats/types but re-tags AVAILABILITY via
  // isNonstandard. admin.service seeds only species where `!isNonstandard`,
  // so the meaningful diff is: which species flip in/out of that filter.
  hr('3. Availability diff: champions-legal vs base gen-9-legal (the !isNonstandard set)');
  const isLegal = (s: any) => !s.isNonstandard;
  const baseById = new Map(base.species.all().map((s) => [s.id, s]));
  const champLegal = new Set(champ.species.all().filter(isLegal).map((s) => s.id));
  const baseLegal = new Set(base.species.all().filter(isLegal).map((s) => s.id));

  const droppedFromChampions = [...baseLegal].filter((id) => !champLegal.has(id));
  const addedInChampions = [...champLegal].filter((id) => !baseLegal.has(id));
  const statChanged: string[] = [];
  for (const s of champ.species.all()) {
    const b = baseById.get(s.id);
    if (b && (b.bst !== s.bst || b.types.join('/') !== s.types.join('/'))) {
      statChanged.push(`${s.name}: bst ${b.bst}->${s.bst}, types ${b.types.join('/')}->${s.types.join('/')}`);
    }
  }
  console.log(`  champions-legal species : ${champLegal.size}`);
  console.log(`  base g9-legal species   : ${baseLegal.size}`);
  console.log(`  legal in g9 but NOT in champions (${droppedFromChampions.length}), sample:`);
  console.log(droppedFromChampions.slice(0, 15).map((id) => `    ${baseById.get(id)?.name}`).join('\n') || '    (none)');
  console.log(`  legal in champions but NOT in base g9 (${addedInChampions.length}), sample:`);
  console.log(addedInChampions.slice(0, 15).map((id) => `    ${champ.species.get(id)?.name}`).join('\n') || '    (none)');
  console.log(`  stat/type re-tuned species (${statChanged.length}):`);
  console.log(statChanged.slice(0, 15).map((x) => `    ${x}`).join('\n') || '    (none)');

  // --- A single fully-shaped species, exactly the fields admin.service seeds ---
  hr('4. Sample champions species shaped like admin.service seeding');
  const sample = champ.species.all().find((s) => !(s as any).isNonstandard) ?? champ.species.all()[0];
  const learnset = await champ.learnsets.get(sample.id);
  const moveCount = learnset?.learnset ? Object.keys(learnset.learnset).length : 0;
  console.log(JSON.stringify(
    {
      dexId: sample.num,
      name: sample.name,
      baseStats: sample.baseStats,
      baseStatTotal: sample.bst,
      types: sample.types,
      abilities: Object.values(sample.abilities),
      heightm: (sample as any).heightm,
      weightkg: sample.weightkg,
      isNonstandard: (sample as any).isNonstandard ?? null,
      learnableMoves: moveCount,
    },
    null,
    2,
  ));

  console.log('\nDone.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
