import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '../../.env' });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  JWT_SECRET: z.string().default('rydo-super-secret-key-123456'),
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL environment variable is required'
  })
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
