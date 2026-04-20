import { DataSource } from 'typeorm';
import { dataSourceOptions } from './database.config';

const MigrationDataSource = new DataSource({
  ...dataSourceOptions,
  synchronize: false,
  logging: false,
});

export default MigrationDataSource;
