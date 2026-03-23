// ═══════════════════════════════════════════════════════════════════════════════
// Drizzle ORM Database Client
// ═══════════════════════════════════════════════════════════════════════════════

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create PostgreSQL client
const client = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 5,
});

// Create Drizzle client with schema
export const db = drizzle(client, { schema });

// Export schema for easy access
export * from './schema';
