import { MigrationInterface, QueryRunner } from "typeorm";

export class GenerationSchemaUpdate1771256898418 implements MigrationInterface {
    name = 'GenerationSchemaUpdate1771256898418'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "season_pokemon" DROP CONSTRAINT "FK_a06377ae14aa0c893a8d61450db"`);
        await queryRunner.query(`CREATE TABLE "season_pokemon_team" ("id" SERIAL NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "season_pokemon_id" integer NOT NULL, "team_id" integer NOT NULL, CONSTRAINT "UQ_a743e7571dcdaac6444707dd198" UNIQUE ("season_pokemon_id", "team_id"), CONSTRAINT "PK_a06377ae14aa0c893a8d61450db" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pokemon_moves" ("pokemon_id" integer NOT NULL, "move_id" integer NOT NULL, CONSTRAINT "PK_1ec9024162fdea75ea77eaea53e" PRIMARY KEY ("pokemon_id", "move_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7d217b47e211731bc22f4ecfb0" ON "pokemon_moves" ("pokemon_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_086ca245bcd0cafbb4fe43df46" ON "pokemon_moves" ("move_id") `);
        await queryRunner.query(`ALTER TABLE "season_pokemon" DROP COLUMN "team_id"`);
        await queryRunner.query(`ALTER TABLE "ability" ADD "generation_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "move" ADD "generation_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pokemon" ADD "generation_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ability" DROP CONSTRAINT "UQ_0fa99a1f1c7d4f40fe2220cf1f0"`);
        await queryRunner.query(`ALTER TABLE "move" DROP CONSTRAINT "UQ_4b71f3dd3a999b934630363fee3"`);
        await queryRunner.query(`ALTER TABLE "pokemon" DROP CONSTRAINT "UQ_1cb8fc72a68e5a601312c642c82"`);
        await queryRunner.query(`ALTER TABLE "ability" ADD CONSTRAINT "UQ_b6cddfdcd91861b5a1b26d8c923" UNIQUE ("name", "generation_id")`);
        await queryRunner.query(`ALTER TABLE "move" ADD CONSTRAINT "UQ_e19996ef83f7a80742d21c30d40" UNIQUE ("name", "generation_id")`);
        await queryRunner.query(`ALTER TABLE "pokemon" ADD CONSTRAINT "UQ_d99f6526df886c9d23d90e03e42" UNIQUE ("name", "generation_id")`);
        await queryRunner.query(`ALTER TABLE "ability" ADD CONSTRAINT "FK_33779f4774e861e1c37b9ba6bb5" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "move" ADD CONSTRAINT "FK_916646416e864ec9455a344d1fb" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pokemon" ADD CONSTRAINT "FK_500c56f49162b480e4c762aa5cb" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "season_pokemon_team" ADD CONSTRAINT "FK_57d8967436aff21e790ac5bc976" FOREIGN KEY ("season_pokemon_id") REFERENCES "season_pokemon"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "season_pokemon_team" ADD CONSTRAINT "FK_69c312384e33978a0e92795fc34" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pokemon_moves" ADD CONSTRAINT "FK_7d217b47e211731bc22f4ecfb09" FOREIGN KEY ("pokemon_id") REFERENCES "pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "pokemon_moves" ADD CONSTRAINT "FK_086ca245bcd0cafbb4fe43df46c" FOREIGN KEY ("move_id") REFERENCES "move"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pokemon_moves" DROP CONSTRAINT "FK_086ca245bcd0cafbb4fe43df46c"`);
        await queryRunner.query(`ALTER TABLE "pokemon_moves" DROP CONSTRAINT "FK_7d217b47e211731bc22f4ecfb09"`);
        await queryRunner.query(`ALTER TABLE "season_pokemon_team" DROP CONSTRAINT "FK_69c312384e33978a0e92795fc34"`);
        await queryRunner.query(`ALTER TABLE "season_pokemon_team" DROP CONSTRAINT "FK_57d8967436aff21e790ac5bc976"`);
        await queryRunner.query(`ALTER TABLE "pokemon" DROP CONSTRAINT "FK_500c56f49162b480e4c762aa5cb"`);
        await queryRunner.query(`ALTER TABLE "move" DROP CONSTRAINT "FK_916646416e864ec9455a344d1fb"`);
        await queryRunner.query(`ALTER TABLE "ability" DROP CONSTRAINT "FK_33779f4774e861e1c37b9ba6bb5"`);
        await queryRunner.query(`ALTER TABLE "pokemon" DROP CONSTRAINT "UQ_d99f6526df886c9d23d90e03e42"`);
        await queryRunner.query(`ALTER TABLE "move" DROP CONSTRAINT "UQ_e19996ef83f7a80742d21c30d40"`);
        await queryRunner.query(`ALTER TABLE "ability" DROP CONSTRAINT "UQ_b6cddfdcd91861b5a1b26d8c923"`);
        await queryRunner.query(`ALTER TABLE "pokemon" ADD CONSTRAINT "UQ_1cb8fc72a68e5a601312c642c82" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "move" ADD CONSTRAINT "UQ_4b71f3dd3a999b934630363fee3" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "ability" ADD CONSTRAINT "UQ_0fa99a1f1c7d4f40fe2220cf1f0" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "pokemon" DROP COLUMN "generation_id"`);
        await queryRunner.query(`ALTER TABLE "move" DROP COLUMN "generation_id"`);
        await queryRunner.query(`ALTER TABLE "ability" DROP COLUMN "generation_id"`);
        await queryRunner.query(`ALTER TABLE "season_pokemon" ADD "team_id" integer`);
        await queryRunner.query(`DROP INDEX "public"."IDX_086ca245bcd0cafbb4fe43df46"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d217b47e211731bc22f4ecfb0"`);
        await queryRunner.query(`DROP TABLE "pokemon_moves"`);
        await queryRunner.query(`DROP TABLE "season_pokemon_team"`);
        await queryRunner.query(`ALTER TABLE "season_pokemon" ADD CONSTRAINT "FK_a06377ae14aa0c893a8d61450db" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
