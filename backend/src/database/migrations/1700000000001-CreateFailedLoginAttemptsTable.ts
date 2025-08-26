import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateFailedLoginAttemptsTable1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'failed_login_attempts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'username',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'attempts',
            type: 'int',
            default: 0,
          },
          {
            name: 'first_attempt_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'last_attempt_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'blocked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Создаем индексы для оптимизации запросов
    await queryRunner.query('CREATE INDEX IDX_FAILED_LOGIN_USERNAME ON failed_login_attempts (username)');
    await queryRunner.query('CREATE INDEX IDX_FAILED_LOGIN_IP_ADDRESS ON failed_login_attempts (ip_address)');
    await queryRunner.query('CREATE INDEX IDX_FAILED_LOGIN_ATTEMPTS ON failed_login_attempts (attempts)');
    await queryRunner.query('CREATE INDEX IDX_FAILED_LOGIN_LAST_ATTEMPT ON failed_login_attempts (last_attempt_at)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('failed_login_attempts');
  }
}
