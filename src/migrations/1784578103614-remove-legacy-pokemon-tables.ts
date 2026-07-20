import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLegacyPokemonTables1784578103614 implements MigrationInterface {
  name = 'RemoveLegacyPokemonTables1784578103614';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pokemon_move" DROP CONSTRAINT "FK_3fa42e7c13f7b84252bf652a88b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon_move" DROP CONSTRAINT "FK_5146bc7c4b75a54c0e7a4380aeb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon_move" DROP CONSTRAINT "FK_295e4201cfaf12ed91f571038b0"`,
    );
    await queryRunner.query(`DROP TABLE "pokemon_move"`);
    await queryRunner.query(
      `ALTER TABLE "pokemon_generations" DROP CONSTRAINT "FK_821a4a5e8657e94256d265cbd81"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon_generations" DROP CONSTRAINT "FK_66483ca68ef5a02c0d9dd8db12c"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_821a4a5e8657e94256d265cbd8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_66483ca68ef5a02c0d9dd8db12"`);
    await queryRunner.query(`DROP TABLE "pokemon_generations"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "pokemon_generations" ("pokemon_id" integer NOT NULL, "generation_id" integer NOT NULL, CONSTRAINT "PK_1d27ada913206e311bfb4f87e08" PRIMARY KEY ("pokemon_id", "generation_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_66483ca68ef5a02c0d9dd8db12" ON "pokemon_generations" ("pokemon_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_821a4a5e8657e94256d265cbd8" ON "pokemon_generations" ("generation_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon_generations" ADD CONSTRAINT "FK_66483ca68ef5a02c0d9dd8db12c" FOREIGN KEY ("pokemon_id") REFERENCES "pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon_generations" ADD CONSTRAINT "FK_821a4a5e8657e94256d265cbd81" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "pokemon_move" ("id" SERIAL NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "pokemon_id" integer NOT NULL, "move_id" integer NOT NULL, "generation_id" integer NOT NULL, CONSTRAINT "UQ_c4ece811fb49f6c55af77b80935" UNIQUE ("pokemon_id", "move_id", "generation_id"), CONSTRAINT "PK_1f944675e50c048fa1d0ab931e5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon_move" ADD CONSTRAINT "FK_295e4201cfaf12ed91f571038b0" FOREIGN KEY ("pokemon_id") REFERENCES "pokemon"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon_move" ADD CONSTRAINT "FK_5146bc7c4b75a54c0e7a4380aeb" FOREIGN KEY ("move_id") REFERENCES "move"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon_move" ADD CONSTRAINT "FK_3fa42e7c13f7b84252bf652a88b" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
