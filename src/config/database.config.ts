import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config();

// Database configuration for TypeORM
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'draftmons',
  entities: [path.join(__dirname, '../entities/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
  synchronize: process.env.NODE_ENV === 'development', // Only true for development
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production',
};

// Create and export the DataSource instance
const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;
