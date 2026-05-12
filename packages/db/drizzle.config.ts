import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://b2b:b2b@localhost:5432/b2b_portal',
  },
} satisfies Config;
