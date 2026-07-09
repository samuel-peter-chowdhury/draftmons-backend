import { MigrationInterface, QueryRunner } from 'typeorm';

export class NatDexIdFix1783555200000 implements MigrationInterface {
  name = 'NatDexIdFix1783555200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop FK constraints referencing generation.id
    await queryRunner.query(`ALTER TABLE "pokemon_move" DROP CONSTRAINT "FK_3fa42e7c13f7b84252bf652a88b"`);
    await queryRunner.query(`ALTER TABLE "pokemon_generations" DROP CONSTRAINT "FK_821a4a5e8657e94256d265cbd81"`);
    await queryRunner.query(`ALTER TABLE "season" DROP CONSTRAINT "FK_4e41f913eddf4b9b711201a4362"`);
    await queryRunner.query(`ALTER TABLE "ability" DROP CONSTRAINT "FK_33779f4774e861e1c37b9ba6bb5"`);
    await queryRunner.query(`ALTER TABLE "move" DROP CONSTRAINT "FK_916646416e864ec9455a344d1fb"`);
    await queryRunner.query(`ALTER TABLE "pokemon" DROP CONSTRAINT "FK_500c56f49162b480e4c762aa5cb"`);
    await queryRunner.query(`ALTER TABLE "item" DROP CONSTRAINT "FK_61c89c7a40b7abf3de2f11eaa34"`);
    await queryRunner.query(`ALTER TABLE "team_build" DROP CONSTRAINT "FK_abf6d65abe10e8e6ed22ec3a5dd"`);

    // Drop UNIQUE constraints on (name, generation_id) — these would cause row-by-row
    // conflicts during bulk UPDATE, same as the PK. Restored at the end.
    await queryRunner.query(`ALTER TABLE "ability" DROP CONSTRAINT "UQ_b6cddfdcd91861b5a1b26d8c923"`);
    await queryRunner.query(`ALTER TABLE "move" DROP CONSTRAINT "UQ_e19996ef83f7a80742d21c30d40"`);
    await queryRunner.query(`ALTER TABLE "pokemon" DROP CONSTRAINT "UQ_d99f6526df886c9d23d90e03e42"`);
    await queryRunner.query(`ALTER TABLE "item" DROP CONSTRAINT "UQ_feb7bbe70bdf6d5bf0f423b4252"`);

    // Drop the composite PK on pokemon_generations (pokemon_id, generation_id)
    await queryRunner.query(`ALTER TABLE "pokemon_generations" DROP CONSTRAINT "PK_1d27ada913206e311bfb4f87e08"`);

    // Shift generation IDs from highest to lowest to avoid PK conflicts (PostgreSQL
    // checks the PK constraint after each individual row update, not at statement end).
    await queryRunner.query(`UPDATE "generation" SET id = 10 WHERE id = 9`);
    await queryRunner.query(`UPDATE "generation" SET id = 9 WHERE id = 8`);
    await queryRunner.query(`UPDATE "generation" SET id = 8 WHERE id = 7`);
    await queryRunner.query(`UPDATE "generation" SET id = 7 WHERE id = 6`);
    await queryRunner.query(`UPDATE "generation" SET id = 6 WHERE id = 5`);
    await queryRunner.query(`UPDATE "generation" SET id = 5 WHERE id = 4`);
    await queryRunner.query(`UPDATE "generation" SET id = 4 WHERE id = 3`);
    await queryRunner.query(`UPDATE "generation" SET id = 3 WHERE id = 2`);
    await queryRunner.query(`UPDATE "generation" SET id = 2 WHERE id = 1`);
    await queryRunner.query(`UPDATE "generation" SET id = 1 WHERE id = 0`);

    // Bulk update child tables — safe now that FK and UNIQUE constraints are dropped
    await queryRunner.query(`UPDATE "pokemon_move" SET generation_id = generation_id + 1`);
    await queryRunner.query(`UPDATE "pokemon_generations" SET generation_id = generation_id + 1`);
    await queryRunner.query(`UPDATE "season" SET generation_id = generation_id + 1`);
    await queryRunner.query(`UPDATE "ability" SET generation_id = generation_id + 1`);
    await queryRunner.query(`UPDATE "move" SET generation_id = generation_id + 1`);
    await queryRunner.query(`UPDATE "pokemon" SET generation_id = generation_id + 1`);
    await queryRunner.query(`UPDATE "item" SET generation_id = generation_id + 1`);
    await queryRunner.query(`UPDATE "team_build" SET generation_id = generation_id + 1`);

    // Reset sequence so next auto-increment insert comes after the new max ID (10)
    await queryRunner.query(
      `SELECT setval(pg_get_serial_sequence('generation', 'id'), (SELECT MAX(id) FROM "generation"))`,
    );

    // Re-add composite PK on pokemon_generations
    await queryRunner.query(
      `ALTER TABLE "pokemon_generations" ADD CONSTRAINT "PK_1d27ada913206e311bfb4f87e08" PRIMARY KEY ("pokemon_id", "generation_id")`,
    );

    // Re-add UNIQUE constraints
    await queryRunner.query(`ALTER TABLE "ability" ADD CONSTRAINT "UQ_b6cddfdcd91861b5a1b26d8c923" UNIQUE ("name", "generation_id")`);
    await queryRunner.query(`ALTER TABLE "move" ADD CONSTRAINT "UQ_e19996ef83f7a80742d21c30d40" UNIQUE ("name", "generation_id")`);
    await queryRunner.query(`ALTER TABLE "pokemon" ADD CONSTRAINT "UQ_d99f6526df886c9d23d90e03e42" UNIQUE ("name", "generation_id")`);
    await queryRunner.query(`ALTER TABLE "item" ADD CONSTRAINT "UQ_feb7bbe70bdf6d5bf0f423b4252" UNIQUE ("name", "generation_id")`);

    // Re-add FK constraints
    await queryRunner.query(
      `ALTER TABLE "pokemon_move" ADD CONSTRAINT "FK_3fa42e7c13f7b84252bf652a88b" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon_generations" ADD CONSTRAINT "FK_821a4a5e8657e94256d265cbd81" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "season" ADD CONSTRAINT "FK_4e41f913eddf4b9b711201a4362" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ability" ADD CONSTRAINT "FK_33779f4774e861e1c37b9ba6bb5" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "move" ADD CONSTRAINT "FK_916646416e864ec9455a344d1fb" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon" ADD CONSTRAINT "FK_500c56f49162b480e4c762aa5cb" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" ADD CONSTRAINT "FK_61c89c7a40b7abf3de2f11eaa34" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_build" ADD CONSTRAINT "FK_abf6d65abe10e8e6ed22ec3a5dd" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FK constraints
    await queryRunner.query(`ALTER TABLE "pokemon_move" DROP CONSTRAINT "FK_3fa42e7c13f7b84252bf652a88b"`);
    await queryRunner.query(`ALTER TABLE "pokemon_generations" DROP CONSTRAINT "FK_821a4a5e8657e94256d265cbd81"`);
    await queryRunner.query(`ALTER TABLE "season" DROP CONSTRAINT "FK_4e41f913eddf4b9b711201a4362"`);
    await queryRunner.query(`ALTER TABLE "ability" DROP CONSTRAINT "FK_33779f4774e861e1c37b9ba6bb5"`);
    await queryRunner.query(`ALTER TABLE "move" DROP CONSTRAINT "FK_916646416e864ec9455a344d1fb"`);
    await queryRunner.query(`ALTER TABLE "pokemon" DROP CONSTRAINT "FK_500c56f49162b480e4c762aa5cb"`);
    await queryRunner.query(`ALTER TABLE "item" DROP CONSTRAINT "FK_61c89c7a40b7abf3de2f11eaa34"`);
    await queryRunner.query(`ALTER TABLE "team_build" DROP CONSTRAINT "FK_abf6d65abe10e8e6ed22ec3a5dd"`);

    // Drop UNIQUE and composite PK constraints
    await queryRunner.query(`ALTER TABLE "ability" DROP CONSTRAINT "UQ_b6cddfdcd91861b5a1b26d8c923"`);
    await queryRunner.query(`ALTER TABLE "move" DROP CONSTRAINT "UQ_e19996ef83f7a80742d21c30d40"`);
    await queryRunner.query(`ALTER TABLE "pokemon" DROP CONSTRAINT "UQ_d99f6526df886c9d23d90e03e42"`);
    await queryRunner.query(`ALTER TABLE "item" DROP CONSTRAINT "UQ_feb7bbe70bdf6d5bf0f423b4252"`);
    await queryRunner.query(`ALTER TABLE "pokemon_generations" DROP CONSTRAINT "PK_1d27ada913206e311bfb4f87e08"`);

    // Shift generation IDs back from lowest to highest (1→0, 2→1, ..., 10→9)
    await queryRunner.query(`UPDATE "generation" SET id = 0 WHERE id = 1`);
    await queryRunner.query(`UPDATE "generation" SET id = 1 WHERE id = 2`);
    await queryRunner.query(`UPDATE "generation" SET id = 2 WHERE id = 3`);
    await queryRunner.query(`UPDATE "generation" SET id = 3 WHERE id = 4`);
    await queryRunner.query(`UPDATE "generation" SET id = 4 WHERE id = 5`);
    await queryRunner.query(`UPDATE "generation" SET id = 5 WHERE id = 6`);
    await queryRunner.query(`UPDATE "generation" SET id = 6 WHERE id = 7`);
    await queryRunner.query(`UPDATE "generation" SET id = 7 WHERE id = 8`);
    await queryRunner.query(`UPDATE "generation" SET id = 8 WHERE id = 9`);
    await queryRunner.query(`UPDATE "generation" SET id = 9 WHERE id = 10`);

    // Bulk update child tables
    await queryRunner.query(`UPDATE "pokemon_move" SET generation_id = generation_id - 1`);
    await queryRunner.query(`UPDATE "pokemon_generations" SET generation_id = generation_id - 1`);
    await queryRunner.query(`UPDATE "season" SET generation_id = generation_id - 1`);
    await queryRunner.query(`UPDATE "ability" SET generation_id = generation_id - 1`);
    await queryRunner.query(`UPDATE "move" SET generation_id = generation_id - 1`);
    await queryRunner.query(`UPDATE "pokemon" SET generation_id = generation_id - 1`);
    await queryRunner.query(`UPDATE "item" SET generation_id = generation_id - 1`);
    await queryRunner.query(`UPDATE "team_build" SET generation_id = generation_id - 1`);

    // Reset sequence
    await queryRunner.query(
      `SELECT setval(pg_get_serial_sequence('generation', 'id'), (SELECT MAX(id) FROM "generation"))`,
    );

    // Re-add composite PK on pokemon_generations
    await queryRunner.query(
      `ALTER TABLE "pokemon_generations" ADD CONSTRAINT "PK_1d27ada913206e311bfb4f87e08" PRIMARY KEY ("pokemon_id", "generation_id")`,
    );

    // Re-add UNIQUE constraints
    await queryRunner.query(`ALTER TABLE "ability" ADD CONSTRAINT "UQ_b6cddfdcd91861b5a1b26d8c923" UNIQUE ("name", "generation_id")`);
    await queryRunner.query(`ALTER TABLE "move" ADD CONSTRAINT "UQ_e19996ef83f7a80742d21c30d40" UNIQUE ("name", "generation_id")`);
    await queryRunner.query(`ALTER TABLE "pokemon" ADD CONSTRAINT "UQ_d99f6526df886c9d23d90e03e42" UNIQUE ("name", "generation_id")`);
    await queryRunner.query(`ALTER TABLE "item" ADD CONSTRAINT "UQ_feb7bbe70bdf6d5bf0f423b4252" UNIQUE ("name", "generation_id")`);

    // Re-add FK constraints
    await queryRunner.query(
      `ALTER TABLE "pokemon_move" ADD CONSTRAINT "FK_3fa42e7c13f7b84252bf652a88b" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon_generations" ADD CONSTRAINT "FK_821a4a5e8657e94256d265cbd81" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "season" ADD CONSTRAINT "FK_4e41f913eddf4b9b711201a4362" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ability" ADD CONSTRAINT "FK_33779f4774e861e1c37b9ba6bb5" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "move" ADD CONSTRAINT "FK_916646416e864ec9455a344d1fb" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon" ADD CONSTRAINT "FK_500c56f49162b480e4c762aa5cb" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" ADD CONSTRAINT "FK_61c89c7a40b7abf3de2f11eaa34" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_build" ADD CONSTRAINT "FK_abf6d65abe10e8e6ed22ec3a5dd" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }
}
