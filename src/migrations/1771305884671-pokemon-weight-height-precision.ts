import { MigrationInterface, QueryRunner } from "typeorm";

export class PokemonWeightHeightPrecision1771305884671 implements MigrationInterface {
    name = 'PokemonWeightHeightPrecision1771305884671'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pokemon" DROP COLUMN "height"`);
        await queryRunner.query(`ALTER TABLE "pokemon" ADD "height" double precision NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pokemon" DROP COLUMN "weight"`);
        await queryRunner.query(`ALTER TABLE "pokemon" ADD "weight" double precision NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pokemon" DROP COLUMN "weight"`);
        await queryRunner.query(`ALTER TABLE "pokemon" ADD "weight" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pokemon" DROP COLUMN "height"`);
        await queryRunner.query(`ALTER TABLE "pokemon" ADD "height" integer NOT NULL`);
    }

}
