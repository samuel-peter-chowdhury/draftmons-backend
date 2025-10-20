import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveMatchTeamAndCreateUniqueConstraints1758486118342 implements MigrationInterface {
  name = 'RemoveMatchTeamAndCreateUniqueConstraints1758486118342';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "team_matches" ("team_id" integer NOT NULL, "match_id" integer NOT NULL, CONSTRAINT "PK_a572107a923ec62745db0355f77" PRIMARY KEY ("team_id", "match_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80a0a861ee4499eaea0369f6f2" ON "team_matches" ("team_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dcee14dc65d2c1abf522845d9d" ON "team_matches" ("match_id") `,
    );
    await queryRunner.query(`ALTER TABLE "match" ADD "losing_team_id" integer`);
    await queryRunner.query(`ALTER TABLE "match" ADD "winning_team_id" integer`);
    await queryRunner.query(`ALTER TABLE "game" ADD "losing_team_id" integer NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "league_user" DROP CONSTRAINT "FK_8a9bb31e511097f1fba50dbb1c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_user" DROP CONSTRAINT "FK_2f0fa73cd24464f8c657026f603"`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_user" DROP CONSTRAINT "PK_84a03f1c8b7ca5c0cd13a8cc83d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_user" ADD CONSTRAINT "PK_b4da162c6fc20e42b02ef874fc7" PRIMARY KEY ("id", "user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_user" DROP CONSTRAINT "PK_b4da162c6fc20e42b02ef874fc7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_user" ADD CONSTRAINT "PK_12289821a4080fad99b3870a165" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "league" ADD CONSTRAINT "UQ_110716368f5130cdc669dacea42" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "league" ADD CONSTRAINT "UQ_0d5e2ecbc44da48a2b5e09f51d1" UNIQUE ("abbreviation")`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon_type" ADD CONSTRAINT "UQ_605605b8362b190c2d00e4789fd" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon_type" ADD CONSTRAINT "UQ_e575f4d7038c22aae497be835f0" UNIQUE ("color")`,
    );
    await queryRunner.query(
      `ALTER TABLE "move" ADD CONSTRAINT "UQ_4b71f3dd3a999b934630363fee3" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "generation" ADD CONSTRAINT "UQ_97ea6861407ef35fd5dc13ad75e" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "ability" ADD CONSTRAINT "UQ_0fa99a1f1c7d4f40fe2220cf1f0" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon" ADD CONSTRAINT "UQ_1cb8fc72a68e5a601312c642c82" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "game" ADD CONSTRAINT "UQ_9bfefd88ed631e56bb388dc878c" UNIQUE ("replay_link")`,
    );
    await queryRunner.query(`ALTER TABLE "game_stat" ALTER COLUMN "direct_kills" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "game_stat" ALTER COLUMN "indirect_kills" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "game_stat" ALTER COLUMN "deaths" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "league_user" ADD CONSTRAINT "UQ_8f32ecea097182f6c13db898ee9" UNIQUE ("league_id", "user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "type_effective" ADD CONSTRAINT "UQ_e5382da3bc7b455e38ce759501c" UNIQUE ("pokemon_id", "pokemon_type_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon_move" ADD CONSTRAINT "UQ_c4ece811fb49f6c55af77b80935" UNIQUE ("pokemon_id", "move_id", "generation_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "week" ADD CONSTRAINT "UQ_3108a48a28e961a2dbab88f8f15" UNIQUE ("name", "season_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_stat" ADD CONSTRAINT "UQ_3dea55bb790481a51be386aaf3a" UNIQUE ("game_id", "season_pokemon_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "season_pokemon" ADD CONSTRAINT "UQ_6207c82df39823478519c4f5bc7" UNIQUE ("season_id", "pokemon_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "season" ADD CONSTRAINT "UQ_235349ad1283fff18efdb8f8874" UNIQUE ("name", "league_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "team" ADD CONSTRAINT "UQ_47b1dd1d84971207ebab9f9c851" UNIQUE ("name", "season_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_user" ADD CONSTRAINT "FK_8a9bb31e511097f1fba50dbb1c2" FOREIGN KEY ("league_id") REFERENCES "league"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_user" ADD CONSTRAINT "FK_2f0fa73cd24464f8c657026f603" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "match" ADD CONSTRAINT "FK_720bb4e547353517de107aeeeec" FOREIGN KEY ("losing_team_id") REFERENCES "team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "match" ADD CONSTRAINT "FK_6df4b341c6e5a10411e9c921679" FOREIGN KEY ("winning_team_id") REFERENCES "team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game" ADD CONSTRAINT "FK_6a89b28878c4c98021b35fd2c86" FOREIGN KEY ("losing_team_id") REFERENCES "team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_matches" ADD CONSTRAINT "FK_80a0a861ee4499eaea0369f6f2e" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_matches" ADD CONSTRAINT "FK_dcee14dc65d2c1abf522845d9d4" FOREIGN KEY ("match_id") REFERENCES "match"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "match_team" DROP CONSTRAINT "FK_0214c8649a3d8a0a20cb8f7603d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "match_team" DROP CONSTRAINT "FK_ecac84ca6aa1cca9d76b6a76dd6"`,
    );
    await queryRunner.query(`DROP TABLE "match_team"`);
    await queryRunner.query(`DROP TYPE "public"."match_team_status_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "team_matches" DROP CONSTRAINT "FK_dcee14dc65d2c1abf522845d9d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_matches" DROP CONSTRAINT "FK_80a0a861ee4499eaea0369f6f2e"`,
    );
    await queryRunner.query(`ALTER TABLE "game" DROP CONSTRAINT "FK_6a89b28878c4c98021b35fd2c86"`);
    await queryRunner.query(`ALTER TABLE "match" DROP CONSTRAINT "FK_6df4b341c6e5a10411e9c921679"`);
    await queryRunner.query(`ALTER TABLE "match" DROP CONSTRAINT "FK_720bb4e547353517de107aeeeec"`);
    await queryRunner.query(
      `ALTER TABLE "league_user" DROP CONSTRAINT "FK_2f0fa73cd24464f8c657026f603"`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_user" DROP CONSTRAINT "FK_8a9bb31e511097f1fba50dbb1c2"`,
    );
    await queryRunner.query(`ALTER TABLE "team" DROP CONSTRAINT "UQ_47b1dd1d84971207ebab9f9c851"`);
    await queryRunner.query(
      `ALTER TABLE "season" DROP CONSTRAINT "UQ_235349ad1283fff18efdb8f8874"`,
    );
    await queryRunner.query(
      `ALTER TABLE "season_pokemon" DROP CONSTRAINT "UQ_6207c82df39823478519c4f5bc7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_stat" DROP CONSTRAINT "UQ_3dea55bb790481a51be386aaf3a"`,
    );
    await queryRunner.query(`ALTER TABLE "week" DROP CONSTRAINT "UQ_3108a48a28e961a2dbab88f8f15"`);
    await queryRunner.query(
      `ALTER TABLE "pokemon_move" DROP CONSTRAINT "UQ_c4ece811fb49f6c55af77b80935"`,
    );
    await queryRunner.query(
      `ALTER TABLE "type_effective" DROP CONSTRAINT "UQ_e5382da3bc7b455e38ce759501c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_user" DROP CONSTRAINT "UQ_8f32ecea097182f6c13db898ee9"`,
    );
    await queryRunner.query(`ALTER TABLE "game_stat" ALTER COLUMN "deaths" SET DEFAULT '0'`);
    await queryRunner.query(
      `ALTER TABLE "game_stat" ALTER COLUMN "indirect_kills" SET DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "game_stat" ALTER COLUMN "direct_kills" SET DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "game" DROP CONSTRAINT "UQ_9bfefd88ed631e56bb388dc878c"`);
    await queryRunner.query(
      `ALTER TABLE "pokemon" DROP CONSTRAINT "UQ_1cb8fc72a68e5a601312c642c82"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ability" DROP CONSTRAINT "UQ_0fa99a1f1c7d4f40fe2220cf1f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "generation" DROP CONSTRAINT "UQ_97ea6861407ef35fd5dc13ad75e"`,
    );
    await queryRunner.query(`ALTER TABLE "move" DROP CONSTRAINT "UQ_4b71f3dd3a999b934630363fee3"`);
    await queryRunner.query(
      `ALTER TABLE "pokemon_type" DROP CONSTRAINT "UQ_e575f4d7038c22aae497be835f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pokemon_type" DROP CONSTRAINT "UQ_605605b8362b190c2d00e4789fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "league" DROP CONSTRAINT "UQ_0d5e2ecbc44da48a2b5e09f51d1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "league" DROP CONSTRAINT "UQ_110716368f5130cdc669dacea42"`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_user" DROP CONSTRAINT "PK_12289821a4080fad99b3870a165"`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_user" ADD CONSTRAINT "PK_b4da162c6fc20e42b02ef874fc7" PRIMARY KEY ("id", "user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_user" DROP CONSTRAINT "PK_b4da162c6fc20e42b02ef874fc7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_user" ADD CONSTRAINT "PK_84a03f1c8b7ca5c0cd13a8cc83d" PRIMARY KEY ("id", "league_id", "user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_user" ADD CONSTRAINT "FK_2f0fa73cd24464f8c657026f603" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_user" ADD CONSTRAINT "FK_8a9bb31e511097f1fba50dbb1c2" FOREIGN KEY ("league_id") REFERENCES "league"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "game" DROP COLUMN "losing_team_id"`);
    await queryRunner.query(`ALTER TABLE "match" DROP COLUMN "winning_team_id"`);
    await queryRunner.query(`ALTER TABLE "match" DROP COLUMN "losing_team_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_dcee14dc65d2c1abf522845d9d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_80a0a861ee4499eaea0369f6f2"`);
    await queryRunner.query(`DROP TABLE "team_matches"`);
    await queryRunner.query(
      `CREATE TYPE "public"."match_team_status_enum" AS ENUM('WINNER', 'LOSER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "match_team" ("id" SERIAL NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "match_id" integer NOT NULL, "team_id" integer NOT NULL, "status" "public"."match_team_status_enum", CONSTRAINT "PK_70156510eecd39a459dd00001aa" PRIMARY KEY ("id", "match_id", "team_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "match_team" ADD CONSTRAINT "FK_ecac84ca6aa1cca9d76b6a76dd6" FOREIGN KEY ("match_id") REFERENCES "match"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "match_team" ADD CONSTRAINT "FK_0214c8649a3d8a0a20cb8f7603d" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
