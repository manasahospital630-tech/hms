import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid PostgreSQL connection string' }),
  JWT_SECRET: z.string().min(10, { message: 'JWT_SECRET must be at least 10 characters' }),
  JWT_EXPIRES_IN: z.string().default('24h'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
