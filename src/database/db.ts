import {
  openDatabaseAsync,
  type SQLiteDatabase,
} from 'expo-sqlite';

export const DATABASE_NAME = 'runflow.db';

let databasePromise: Promise<SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await database.execAsync('PRAGMA foreign_keys = ON;');

      return database;
    });
  }

  return databasePromise;
}

export async function withDatabase<T>(
  callback: (database: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  const database = await getDatabase();

  return callback(database);
}
