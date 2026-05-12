import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

let cached: { client: postgres.Sql; db: Database } | null = null;

export const createDb = (connectionString: string): Database => {
  if (cached) return cached.db;
  const client = postgres(connectionString, { max: 10 });
  const db = drizzle(client, { schema });
  cached = { client, db };
  return db;
};

export { schema };
export * from './schema';
