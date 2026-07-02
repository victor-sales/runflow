import type { SQLiteDatabase } from 'expo-sqlite';

import { withDatabase } from '@/database/db';
import { initialSchemaMigration } from '@/database/migrations/001_initial_schema';
import { TABLES } from '@/database/schema';

export type Migration = {
  id: number;
  name: string;
  up: (database: SQLiteDatabase) => Promise<void>;
};

type AppliedMigration = {
  id: number;
};

const migrations: Migration[] = [initialSchemaMigration];

export async function runMigrations(): Promise<void> {
  await withDatabase(async (database) => {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLES.migrations} (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);

    const appliedMigrations = await database.getAllAsync<AppliedMigration>(
      `SELECT id FROM ${TABLES.migrations};`,
    );
    const appliedMigrationIds = new Set(
      appliedMigrations.map((migration) => migration.id),
    );
    const pendingMigrations = migrations.filter(
      (migration) => !appliedMigrationIds.has(migration.id),
    );

    for (const migration of pendingMigrations) {
      await database.withTransactionAsync(async () => {
        await migration.up(database);
        await database.runAsync(
          `INSERT INTO ${TABLES.migrations} (id, name, applied_at) VALUES (?, ?, ?);`,
          migration.id,
          migration.name,
          new Date().toISOString(),
        );
      });
    }
  });
}
