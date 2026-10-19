import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/* Vercel + Neon aggiungono l'indirizzo del database come variabile d'ambiente.
   Il nome cambia a seconda dell'integrazione, quindi si prova il primo disponibile. */
export function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || '';
}

const globalForDb = globalThis as unknown as { flowPool?: Pool };

export function getDb() {
  const url = databaseUrl();
  if (!url) throw new Error('Database non configurato: manca DATABASE_URL.');
  globalForDb.flowPool ??= new Pool({ connectionString: url, max: 3 });
  return drizzle(globalForDb.flowPool, { schema });
}
