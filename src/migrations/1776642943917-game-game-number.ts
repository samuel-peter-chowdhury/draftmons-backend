import { MigrationInterface, QueryRunner } from "typeorm";

export class GameGameNumber1776642943917 implements MigrationInterface {
    name = 'GameGameNumber1776642943917'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game" ADD "game_number" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game" DROP COLUMN "game_number"`);
    }

}
