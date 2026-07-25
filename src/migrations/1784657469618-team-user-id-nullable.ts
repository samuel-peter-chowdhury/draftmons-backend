import { MigrationInterface, QueryRunner } from 'typeorm';

export class TeamUserIdNullable1784657469618 implements MigrationInterface {
  name = 'TeamUserIdNullable1784657469618';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "team" ALTER COLUMN "user_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "team" DROP CONSTRAINT "FK_add64c4bdc53d926d9c0992bccc"`);
    await queryRunner.query(
      `ALTER TABLE "team" ADD CONSTRAINT "FK_add64c4bdc53d926d9c0992bccc" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "team" DROP CONSTRAINT "FK_add64c4bdc53d926d9c0992bccc"`);
    await queryRunner.query(
      `ALTER TABLE "team" ADD CONSTRAINT "FK_add64c4bdc53d926d9c0992bccc" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "team" ALTER COLUMN "user_id" SET NOT NULL`);
  }
}
