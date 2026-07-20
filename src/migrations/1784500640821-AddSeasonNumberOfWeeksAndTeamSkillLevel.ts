import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSeasonNumberOfWeeksAndTeamSkillLevel1784500640821 implements MigrationInterface {
    name = 'AddSeasonNumberOfWeeksAndTeamSkillLevel1784500640821'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "team" ADD "skill_level" integer`);
        await queryRunner.query(`ALTER TABLE "season" ADD "number_of_weeks" integer NOT NULL DEFAULT 10`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "season" DROP COLUMN "number_of_weeks"`);
        await queryRunner.query(`ALTER TABLE "team" DROP COLUMN "skill_level"`);
    }

}
