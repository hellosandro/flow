/* Applica le migrazioni di drizzle/ al database prima di ogni pubblicazione.
   Senza indirizzo del database (ad esempio in locale) non fa nulla. */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
if (!url) {
  console.log('Migrazioni saltate: nessun DATABASE_URL.');
  process.exit(0);
}
const pool = new pg.Pool({ connectionString: url, max: 1 });
await migrate(drizzle(pool), { migrationsFolder: 'drizzle' });
await pool.end();
console.log('Database aggiornato.');
