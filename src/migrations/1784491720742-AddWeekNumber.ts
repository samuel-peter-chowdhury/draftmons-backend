import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWeekNumber1784491720742 implements MigrationInterface {
    name = 'AddWeekNumber1784491720742'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "week" ADD "week_number" integer`);
        await queryRunner.query(`
            UPDATE week
            SET week_number = sub.rn
            FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY season_id ORDER BY id) AS rn
                FROM week
            ) sub
            WHERE week.id = sub.id
        `);
        await queryRunner.query(`ALTER TABLE "week" ALTER COLUMN "week_number" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "week" ADD CONSTRAINT "UQ_32c240f3fe8f5c7d88cc6f34d14" UNIQUE ("week_number", "season_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "week" DROP CONSTRAINT "UQ_32c240f3fe8f5c7d88cc6f34d14"`);
        await queryRunner.query(`ALTER TABLE "week" DROP COLUMN "week_number"`);
    }

}
