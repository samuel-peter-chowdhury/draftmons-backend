import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePasswords1758405657626 implements MigrationInterface {
  name = 'RemovePasswords1758405657626';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password"`);
    await queryRunner.query(`ALTER TABLE "league" DROP COLUMN "password"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "league" ADD "password" character varying`);
    await queryRunner.query(`ALTER TABLE "user" ADD "password" character varying`);
  }
}
