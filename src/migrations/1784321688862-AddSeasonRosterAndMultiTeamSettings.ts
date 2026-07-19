import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSeasonRosterAndMultiTeamSettings1784321688862 implements MigrationInterface {
    name = 'AddSeasonRosterAndMultiTeamSettings1784321688862'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "season" ADD "min_roster_size" integer NOT NULL DEFAULT 10`);
        await queryRunner.query(`ALTER TABLE "season" ALTER COLUMN "min_roster_size" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "season" ADD "max_roster_size" integer NOT NULL DEFAULT 12`);
        await queryRunner.query(`ALTER TABLE "season" ALTER COLUMN "max_roster_size" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "season" ADD "allow_multi_team_pokemon" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "season" DROP COLUMN "allow_multi_team_pokemon"`);
        await queryRunner.query(`ALTER TABLE "season" DROP COLUMN "max_roster_size"`);
        await queryRunner.query(`ALTER TABLE "season" DROP COLUMN "min_roster_size"`);
    }

}
