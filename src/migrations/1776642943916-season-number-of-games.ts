import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeasonNumberOfGames1776642943916 implements MigrationInterface {
  name = 'SeasonNumberOfGames1776642943916';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "season" ADD "number_of_games" integer NOT NULL DEFAULT 3`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "season" DROP COLUMN "number_of_games"`);
  }
}
