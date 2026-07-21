import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageUrlColumns1784657469617 implements MigrationInterface {
    name = 'AddImageUrlColumns1784657469617'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "team" ADD "logo_url" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "avatar_url" character varying`);
        await queryRunner.query(`ALTER TABLE "league" ADD "logo_url" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "league" DROP COLUMN "logo_url"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatar_url"`);
        await queryRunner.query(`ALTER TABLE "team" DROP COLUMN "logo_url"`);
    }

}
