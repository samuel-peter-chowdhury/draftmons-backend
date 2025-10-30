import { MigrationInterface, QueryRunner } from "typeorm";

export class SpecialMoveCategory1761794935944 implements MigrationInterface {
    name = 'SpecialMoveCategory1761794935944'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "special_move_category" ("id" SERIAL NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "UQ_5253d877bc7f5e613772d1f8846" UNIQUE ("name"), CONSTRAINT "PK_47d44b539b4d3a33570f11a755e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "move_special_move_categories" ("move_id" integer NOT NULL, "special_move_category_id" integer NOT NULL, CONSTRAINT "PK_4ad49ad596b5a8638f3f8d337a2" PRIMARY KEY ("move_id", "special_move_category_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5bda18876c1e6828013f563236" ON "move_special_move_categories" ("move_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7af627f62425c88be6f09b894a" ON "move_special_move_categories" ("special_move_category_id") `);
        await queryRunner.query(`ALTER TABLE "move_special_move_categories" ADD CONSTRAINT "FK_5bda18876c1e6828013f5632366" FOREIGN KEY ("move_id") REFERENCES "move"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "move_special_move_categories" ADD CONSTRAINT "FK_7af627f62425c88be6f09b894a5" FOREIGN KEY ("special_move_category_id") REFERENCES "special_move_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "move_special_move_categories" DROP CONSTRAINT "FK_7af627f62425c88be6f09b894a5"`);
        await queryRunner.query(`ALTER TABLE "move_special_move_categories" DROP CONSTRAINT "FK_5bda18876c1e6828013f5632366"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7af627f62425c88be6f09b894a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5bda18876c1e6828013f563236"`);
        await queryRunner.query(`DROP TABLE "move_special_move_categories"`);
        await queryRunner.query(`DROP TABLE "special_move_category"`);
    }

}
