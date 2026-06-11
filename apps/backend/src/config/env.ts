import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export const env = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'rydo-super-secret-key-123456',
  DATABASE_URL: process.env.DATABASE_URL
};
