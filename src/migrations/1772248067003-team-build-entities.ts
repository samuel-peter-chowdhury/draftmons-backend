import { MigrationInterface, QueryRunner } from "typeorm";

export class TeamBuildEntities1772248067003 implements MigrationInterface {
    name = 'TeamBuildEntities1772248067003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "team_build_set" ("id" SERIAL NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "team_build_id" integer NOT NULL, "pokemon_id" integer NOT NULL, "point_value" integer, "condition" character varying, "item_id" integer, "ability_id" integer, "move1_id" integer, "move2_id" integer, "move3_id" integer, "move4_id" integer, "hp_ev" integer NOT NULL DEFAULT '0', "attack_ev" integer NOT NULL DEFAULT '0', "defense_ev" integer NOT NULL DEFAULT '0', "special_attack_ev" integer NOT NULL DEFAULT '0', "special_defense_ev" integer NOT NULL DEFAULT '0', "speed_ev" integer NOT NULL DEFAULT '0', "hp_iv" integer NOT NULL DEFAULT '31', "attack_iv" integer NOT NULL DEFAULT '31', "defense_iv" integer NOT NULL DEFAULT '31', "special_attack_iv" integer NOT NULL DEFAULT '31', "special_defense_iv" integer NOT NULL DEFAULT '31', "speed_iv" integer NOT NULL DEFAULT '31', "nature_id" integer, "move_1_id" integer, "move_2_id" integer, "move_3_id" integer, "move_4_id" integer, CONSTRAINT "UQ_4ac2ff30fca8729e3f92e3d57df" UNIQUE ("team_build_id", "pokemon_id"), CONSTRAINT "PK_1455727aa4b7c64eb1c0fb513b3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "team_build" ("id" SERIAL NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "user_id" integer NOT NULL, "season_id" integer, "generation_id" integer NOT NULL, CONSTRAINT "UQ_ed8fcaca540773c8310ec47fb15" UNIQUE ("name", "user_id"), CONSTRAINT "PK_5bc382da3d1d686a5c6737f26e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "team_build_set" ADD CONSTRAINT "FK_e7dc2b47fb1e892584538082d10" FOREIGN KEY ("team_build_id") REFERENCES "team_build"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_build_set" ADD CONSTRAINT "FK_714b008c17c6e1789dbaded229f" FOREIGN KEY ("pokemon_id") REFERENCES "pokemon"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_build_set" ADD CONSTRAINT "FK_2b2e79874bdbd71d1ef9f2b82e0" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_build_set" ADD CONSTRAINT "FK_2c6a31914c5d08920ad35f4c11f" FOREIGN KEY ("ability_id") REFERENCES "ability"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_build_set" ADD CONSTRAINT "FK_225bcf72b031206ffc138c3b09b" FOREIGN KEY ("move_1_id") REFERENCES "move"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_build_set" ADD CONSTRAINT "FK_084aaa9fa59a425b9f23df9bf7c" FOREIGN KEY ("move_2_id") REFERENCES "move"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_build_set" ADD CONSTRAINT "FK_220da776973bae77b8847caedd7" FOREIGN KEY ("move_3_id") REFERENCES "move"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_build_set" ADD CONSTRAINT "FK_575a61c7aa0c902a682566ba3f7" FOREIGN KEY ("move_4_id") REFERENCES "move"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_build_set" ADD CONSTRAINT "FK_174907ab3a59c2f97bc6ee3ee72" FOREIGN KEY ("nature_id") REFERENCES "nature"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_build" ADD CONSTRAINT "FK_4919da6add4efe07fb5c8ccda5c" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_build" ADD CONSTRAINT "FK_f26834a90e8f2c4c56887fc143d" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_build" ADD CONSTRAINT "FK_abf6d65abe10e8e6ed22ec3a5dd" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "team_build" DROP CONSTRAINT "FK_abf6d65abe10e8e6ed22ec3a5dd"`);
        await queryRunner.query(`ALTER TABLE "team_build" DROP CONSTRAINT "FK_f26834a90e8f2c4c56887fc143d"`);
        await queryRunner.query(`ALTER TABLE "team_build" DROP CONSTRAINT "FK_4919da6add4efe07fb5c8ccda5c"`);
        await queryRunner.query(`ALTER TABLE "team_build_set" DROP CONSTRAINT "FK_174907ab3a59c2f97bc6ee3ee72"`);
        await queryRunner.query(`ALTER TABLE "team_build_set" DROP CONSTRAINT "FK_575a61c7aa0c902a682566ba3f7"`);
        await queryRunner.query(`ALTER TABLE "team_build_set" DROP CONSTRAINT "FK_220da776973bae77b8847caedd7"`);
        await queryRunner.query(`ALTER TABLE "team_build_set" DROP CONSTRAINT "FK_084aaa9fa59a425b9f23df9bf7c"`);
        await queryRunner.query(`ALTER TABLE "team_build_set" DROP CONSTRAINT "FK_225bcf72b031206ffc138c3b09b"`);
        await queryRunner.query(`ALTER TABLE "team_build_set" DROP CONSTRAINT "FK_2c6a31914c5d08920ad35f4c11f"`);
        await queryRunner.query(`ALTER TABLE "team_build_set" DROP CONSTRAINT "FK_2b2e79874bdbd71d1ef9f2b82e0"`);
        await queryRunner.query(`ALTER TABLE "team_build_set" DROP CONSTRAINT "FK_714b008c17c6e1789dbaded229f"`);
        await queryRunner.query(`ALTER TABLE "team_build_set" DROP CONSTRAINT "FK_e7dc2b47fb1e892584538082d10"`);
        await queryRunner.query(`DROP TABLE "team_build"`);
        await queryRunner.query(`DROP TABLE "team_build_set"`);
    }

}
