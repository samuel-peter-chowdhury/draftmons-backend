import { MigrationInterface, QueryRunner } from "typeorm";

export class NatureItemEntitites1772238453719 implements MigrationInterface {
    name = 'NatureItemEntitites1772238453719'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "item" ("id" SERIAL NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" character varying NOT NULL, "generation_id" integer NOT NULL, CONSTRAINT "UQ_feb7bbe70bdf6d5bf0f423b4252" UNIQUE ("name", "generation_id"), CONSTRAINT "PK_d3c0c71f23e7adcf952a1d13423" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."nature_positive_stat_enum" AS ENUM('HP', 'ATTACK', 'DEFENSE', 'SPECIAL_ATTACK', 'SPECIAL_DEFENSE', 'SPEED')`);
        await queryRunner.query(`CREATE TYPE "public"."nature_negative_stat_enum" AS ENUM('HP', 'ATTACK', 'DEFENSE', 'SPECIAL_ATTACK', 'SPECIAL_DEFENSE', 'SPEED')`);
        await queryRunner.query(`CREATE TABLE "nature" ("id" SERIAL NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" character varying NOT NULL, "positive_stat" "public"."nature_positive_stat_enum", "negative_stat" "public"."nature_negative_stat_enum", CONSTRAINT "UQ_2a9503172896195317975c3d126" UNIQUE ("name"), CONSTRAINT "PK_49931224e0ece835c44e793b34d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "item" ADD CONSTRAINT "FK_61c89c7a40b7abf3de2f11eaa34" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item" DROP CONSTRAINT "FK_61c89c7a40b7abf3de2f11eaa34"`);
        await queryRunner.query(`DROP TABLE "nature"`);
        await queryRunner.query(`DROP TYPE "public"."nature_negative_stat_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nature_positive_stat_enum"`);
        await queryRunner.query(`DROP TABLE "item"`);
    }

}
