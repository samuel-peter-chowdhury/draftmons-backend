import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1746479361518 implements MigrationInterface {
    name = 'InitialSchema1746479361518'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "type_effective" ("pokemon_id" integer NOT NULL, "pokemon_type_id" integer NOT NULL, "value" double precision NOT NULL, CONSTRAINT "PK_e5382da3bc7b455e38ce759501c" PRIMARY KEY ("pokemon_id", "pokemon_type_id"))`);
        await queryRunner.query(`CREATE TABLE "pokemon_type" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "color" character varying NOT NULL, CONSTRAINT "PK_9975e2038d190b4ac724d1f553d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "move" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "pokemon_type_id" integer NOT NULL, "category" character varying NOT NULL, "power" integer NOT NULL, "accuracy" integer NOT NULL, "priority" integer NOT NULL, "pp" integer NOT NULL, "description" character varying NOT NULL, CONSTRAINT "PK_0befa9c6b3a216e49c494b4acc5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pokemon_move" ("pokemon_id" integer NOT NULL, "move_id" integer NOT NULL, "gen" character varying NOT NULL, CONSTRAINT "PK_7bb2b6d8d36ec12bb97a3bfa808" PRIMARY KEY ("pokemon_id", "move_id"))`);
        await queryRunner.query(`CREATE TABLE "ability" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "PK_5643559d435d01ec126981417a2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pokemon" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "dex_id" integer NOT NULL, "name" character varying NOT NULL, "hp" integer NOT NULL, "attack" integer NOT NULL, "defense" integer NOT NULL, "special_attack" integer NOT NULL, "special_defense" integer NOT NULL, "speed" integer NOT NULL, "base_stat_total" integer NOT NULL, "height" double precision NOT NULL, "weight" double precision NOT NULL, CONSTRAINT "PK_0b503db1369f46c43f8da0a6a0a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."match_team_status_enum" AS ENUM('WINNER', 'LOSER')`);
        await queryRunner.query(`CREATE TABLE "match_team" ("match_id" integer NOT NULL, "team_id" integer NOT NULL, "status" "public"."match_team_status_enum", CONSTRAINT "PK_e46760a9fd37766d5aa3cf94f0d" PRIMARY KEY ("match_id", "team_id"))`);
        await queryRunner.query(`CREATE TABLE "week" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "season_id" integer NOT NULL, CONSTRAINT "PK_1f85dfadd5f363a1d0bce2b9664" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "match" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "week_id" integer NOT NULL, CONSTRAINT "PK_92b6c3a6631dd5b24a67c69f69d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "game_stat" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "game_id" integer NOT NULL, "season_pokemon_id" integer NOT NULL, "direct_kills" integer NOT NULL DEFAULT '0', "indirect_kills" integer NOT NULL DEFAULT '0', "deaths" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_10f89c0eac30c7d0106a13a3009" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "game" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "match_id" integer NOT NULL, "winning_team_id" integer NOT NULL, "differential" integer NOT NULL, "replay_link" character varying, CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "team" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "season_id" integer NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_f57d8293406df4af348402e4b74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "season_pokemon" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "season_id" integer NOT NULL, "pokemon_id" integer NOT NULL, "team_id" integer, "condition" character varying, "point_value" integer, CONSTRAINT "PK_37ab7530b8d2e3d029982394cf0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."season_status_enum" AS ENUM('PRE_DRAFT', 'DRAFT', 'PRE_SEASON', 'REGULAR_SEASON', 'POST_SEASON', 'PLAYOFFS')`);
        await queryRunner.query(`CREATE TABLE "season" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "gen" character varying NOT NULL, "status" "public"."season_status_enum" NOT NULL DEFAULT 'PRE_DRAFT', "rules" character varying, "point_limit" integer NOT NULL, "max_point_value" integer NOT NULL, "league_id" integer NOT NULL, CONSTRAINT "PK_8ac0d081dbdb7ab02d166bcda9f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "league" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "abbreviation" character varying NOT NULL, "password" character varying, CONSTRAINT "PK_0bd74b698f9e28875df738f7864" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "league_user" ("league_id" integer NOT NULL, "user_id" integer NOT NULL, "is_moderator" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_8f32ecea097182f6c13db898ee9" PRIMARY KEY ("league_id", "user_id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "first_name" character varying, "last_name" character varying, "email" character varying NOT NULL, "password" character varying, "is_admin" boolean NOT NULL DEFAULT false, "google_id" character varying, "showdown_username" character varying, "discord_username" character varying, "timezone" character varying, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_7adac5c0b28492eb292d4a93871" UNIQUE ("google_id"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pokemon_pokemon_types_pokemon_type" ("pokemon_id" integer NOT NULL, "pokemon_type_id" integer NOT NULL, CONSTRAINT "PK_faee2ac53fd7d4889ed4912b185" PRIMARY KEY ("pokemon_id", "pokemon_type_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1a033e4e63eb8428e7ab2d1384" ON "pokemon_pokemon_types_pokemon_type" ("pokemon_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9180ee9fa46094beb648170ba9" ON "pokemon_pokemon_types_pokemon_type" ("pokemon_type_id") `);
        await queryRunner.query(`CREATE TABLE "pokemon_abilities_ability" ("pokemon_id" integer NOT NULL, "ability_id" integer NOT NULL, CONSTRAINT "PK_12987c8b1b2c26e815c0e211c20" PRIMARY KEY ("pokemon_id", "ability_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6bca5ee3a5aa71257b9fce195f" ON "pokemon_abilities_ability" ("pokemon_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_01b766ef15a5e08c78d97309d4" ON "pokemon_abilities_ability" ("ability_id") `);
        await queryRunner.query(`ALTER TABLE "type_effective" ADD CONSTRAINT "FK_d76e508ed791a4560cb6b07750c" FOREIGN KEY ("pokemon_type_id") REFERENCES "pokemon_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "type_effective" ADD CONSTRAINT "FK_2040b6855d9b5cd76c09fdf96af" FOREIGN KEY ("pokemon_id") REFERENCES "pokemon"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "move" ADD CONSTRAINT "FK_dd6997f83225bcefc9609179104" FOREIGN KEY ("pokemon_type_id") REFERENCES "pokemon_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pokemon_move" ADD CONSTRAINT "FK_295e4201cfaf12ed91f571038b0" FOREIGN KEY ("pokemon_id") REFERENCES "pokemon"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pokemon_move" ADD CONSTRAINT "FK_5146bc7c4b75a54c0e7a4380aeb" FOREIGN KEY ("move_id") REFERENCES "move"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "match_team" ADD CONSTRAINT "FK_ecac84ca6aa1cca9d76b6a76dd6" FOREIGN KEY ("match_id") REFERENCES "match"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "match_team" ADD CONSTRAINT "FK_0214c8649a3d8a0a20cb8f7603d" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "week" ADD CONSTRAINT "FK_80850bbbb0a91abe0dab0aec8f8" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "match" ADD CONSTRAINT "FK_18bb825ca9043c817cd7817409c" FOREIGN KEY ("week_id") REFERENCES "week"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_stat" ADD CONSTRAINT "FK_2b179043fdaa59cc8948774374c" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_stat" ADD CONSTRAINT "FK_f0cee5e077352c321ead0687503" FOREIGN KEY ("season_pokemon_id") REFERENCES "season_pokemon"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game" ADD CONSTRAINT "FK_55fd507a9a10c9d8033e88dc7fa" FOREIGN KEY ("match_id") REFERENCES "match"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game" ADD CONSTRAINT "FK_a766733772adcdf56fa83625af3" FOREIGN KEY ("winning_team_id") REFERENCES "team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team" ADD CONSTRAINT "FK_6b53a0bc738afb4f73dcecbf262" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team" ADD CONSTRAINT "FK_add64c4bdc53d926d9c0992bccc" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "season_pokemon" ADD CONSTRAINT "FK_33a299c629772cb00b70f9c1cd1" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "season_pokemon" ADD CONSTRAINT "FK_01f903f7459d6adf1073468daa8" FOREIGN KEY ("pokemon_id") REFERENCES "pokemon"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "season_pokemon" ADD CONSTRAINT "FK_a06377ae14aa0c893a8d61450db" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "season" ADD CONSTRAINT "FK_af08d05f7f111c6f2a31bb88514" FOREIGN KEY ("league_id") REFERENCES "league"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "league_user" ADD CONSTRAINT "FK_8a9bb31e511097f1fba50dbb1c2" FOREIGN KEY ("league_id") REFERENCES "league"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "league_user" ADD CONSTRAINT "FK_2f0fa73cd24464f8c657026f603" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pokemon_pokemon_types_pokemon_type" ADD CONSTRAINT "FK_1a033e4e63eb8428e7ab2d13849" FOREIGN KEY ("pokemon_id") REFERENCES "pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "pokemon_pokemon_types_pokemon_type" ADD CONSTRAINT "FK_9180ee9fa46094beb648170ba95" FOREIGN KEY ("pokemon_type_id") REFERENCES "pokemon_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pokemon_abilities_ability" ADD CONSTRAINT "FK_6bca5ee3a5aa71257b9fce195f4" FOREIGN KEY ("pokemon_id") REFERENCES "pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "pokemon_abilities_ability" ADD CONSTRAINT "FK_01b766ef15a5e08c78d97309d47" FOREIGN KEY ("ability_id") REFERENCES "ability"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pokemon_abilities_ability" DROP CONSTRAINT "FK_01b766ef15a5e08c78d97309d47"`);
        await queryRunner.query(`ALTER TABLE "pokemon_abilities_ability" DROP CONSTRAINT "FK_6bca5ee3a5aa71257b9fce195f4"`);
        await queryRunner.query(`ALTER TABLE "pokemon_pokemon_types_pokemon_type" DROP CONSTRAINT "FK_9180ee9fa46094beb648170ba95"`);
        await queryRunner.query(`ALTER TABLE "pokemon_pokemon_types_pokemon_type" DROP CONSTRAINT "FK_1a033e4e63eb8428e7ab2d13849"`);
        await queryRunner.query(`ALTER TABLE "league_user" DROP CONSTRAINT "FK_2f0fa73cd24464f8c657026f603"`);
        await queryRunner.query(`ALTER TABLE "league_user" DROP CONSTRAINT "FK_8a9bb31e511097f1fba50dbb1c2"`);
        await queryRunner.query(`ALTER TABLE "season" DROP CONSTRAINT "FK_af08d05f7f111c6f2a31bb88514"`);
        await queryRunner.query(`ALTER TABLE "season_pokemon" DROP CONSTRAINT "FK_a06377ae14aa0c893a8d61450db"`);
        await queryRunner.query(`ALTER TABLE "season_pokemon" DROP CONSTRAINT "FK_01f903f7459d6adf1073468daa8"`);
        await queryRunner.query(`ALTER TABLE "season_pokemon" DROP CONSTRAINT "FK_33a299c629772cb00b70f9c1cd1"`);
        await queryRunner.query(`ALTER TABLE "team" DROP CONSTRAINT "FK_add64c4bdc53d926d9c0992bccc"`);
        await queryRunner.query(`ALTER TABLE "team" DROP CONSTRAINT "FK_6b53a0bc738afb4f73dcecbf262"`);
        await queryRunner.query(`ALTER TABLE "game" DROP CONSTRAINT "FK_a766733772adcdf56fa83625af3"`);
        await queryRunner.query(`ALTER TABLE "game" DROP CONSTRAINT "FK_55fd507a9a10c9d8033e88dc7fa"`);
        await queryRunner.query(`ALTER TABLE "game_stat" DROP CONSTRAINT "FK_f0cee5e077352c321ead0687503"`);
        await queryRunner.query(`ALTER TABLE "game_stat" DROP CONSTRAINT "FK_2b179043fdaa59cc8948774374c"`);
        await queryRunner.query(`ALTER TABLE "match" DROP CONSTRAINT "FK_18bb825ca9043c817cd7817409c"`);
        await queryRunner.query(`ALTER TABLE "week" DROP CONSTRAINT "FK_80850bbbb0a91abe0dab0aec8f8"`);
        await queryRunner.query(`ALTER TABLE "match_team" DROP CONSTRAINT "FK_0214c8649a3d8a0a20cb8f7603d"`);
        await queryRunner.query(`ALTER TABLE "match_team" DROP CONSTRAINT "FK_ecac84ca6aa1cca9d76b6a76dd6"`);
        await queryRunner.query(`ALTER TABLE "pokemon_move" DROP CONSTRAINT "FK_5146bc7c4b75a54c0e7a4380aeb"`);
        await queryRunner.query(`ALTER TABLE "pokemon_move" DROP CONSTRAINT "FK_295e4201cfaf12ed91f571038b0"`);
        await queryRunner.query(`ALTER TABLE "move" DROP CONSTRAINT "FK_dd6997f83225bcefc9609179104"`);
        await queryRunner.query(`ALTER TABLE "type_effective" DROP CONSTRAINT "FK_2040b6855d9b5cd76c09fdf96af"`);
        await queryRunner.query(`ALTER TABLE "type_effective" DROP CONSTRAINT "FK_d76e508ed791a4560cb6b07750c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01b766ef15a5e08c78d97309d4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6bca5ee3a5aa71257b9fce195f"`);
        await queryRunner.query(`DROP TABLE "pokemon_abilities_ability"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9180ee9fa46094beb648170ba9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1a033e4e63eb8428e7ab2d1384"`);
        await queryRunner.query(`DROP TABLE "pokemon_pokemon_types_pokemon_type"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "league_user"`);
        await queryRunner.query(`DROP TABLE "league"`);
        await queryRunner.query(`DROP TABLE "season"`);
        await queryRunner.query(`DROP TYPE "public"."season_status_enum"`);
        await queryRunner.query(`DROP TABLE "season_pokemon"`);
        await queryRunner.query(`DROP TABLE "team"`);
        await queryRunner.query(`DROP TABLE "game"`);
        await queryRunner.query(`DROP TABLE "game_stat"`);
        await queryRunner.query(`DROP TABLE "match"`);
        await queryRunner.query(`DROP TABLE "week"`);
        await queryRunner.query(`DROP TABLE "match_team"`);
        await queryRunner.query(`DROP TYPE "public"."match_team_status_enum"`);
        await queryRunner.query(`DROP TABLE "pokemon"`);
        await queryRunner.query(`DROP TABLE "ability"`);
        await queryRunner.query(`DROP TABLE "pokemon_move"`);
        await queryRunner.query(`DROP TABLE "move"`);
        await queryRunner.query(`DROP TABLE "pokemon_type"`);
        await queryRunner.query(`DROP TABLE "type_effective"`);
    }

}
