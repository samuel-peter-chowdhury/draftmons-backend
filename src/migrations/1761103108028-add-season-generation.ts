import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSeasonGeneration1761103108028 implements MigrationInterface {
    name = 'AddSeasonGeneration1761103108028'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "season" RENAME COLUMN "gen" TO "generation_id"`);
        await queryRunner.query(`ALTER TABLE "season" DROP COLUMN "generation_id"`);
        await queryRunner.query(`ALTER TABLE "season" ADD "generation_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "season" ADD CONSTRAINT "FK_4e41f913eddf4b9b711201a4362" FOREIGN KEY ("generation_id") REFERENCES "generation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "season" DROP CONSTRAINT "FK_4e41f913eddf4b9b711201a4362"`);
        await queryRunner.query(`ALTER TABLE "season" DROP COLUMN "generation_id"`);
        await queryRunner.query(`ALTER TABLE "season" ADD "generation_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "season" RENAME COLUMN "generation_id" TO "gen"`);
    }

}
