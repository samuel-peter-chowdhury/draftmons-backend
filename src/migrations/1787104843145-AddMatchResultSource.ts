import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMatchResultSource1787104843145 implements MigrationInterface {
  name = 'AddMatchResultSource1787104843145';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."match_result_source_enum" AS ENUM('REPLAY', 'MANUAL', 'FORFEIT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "match" ADD "result_source" "public"."match_result_source_enum"`,
    );
    // Backfill: every already-resolved match came from the replay pipeline, which
    // was the only way to record a result before this migration. Matches without
    // a winner keep result_source NULL ("no result yet").
    await queryRunner.query(
      `UPDATE "match" SET "result_source" = 'REPLAY' WHERE "winning_team_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "match" DROP COLUMN "result_source"`);
    await queryRunner.query(`DROP TYPE "public"."match_result_source_enum"`);
  }
}
