import type { SQLiteDatabase } from 'expo-sqlite';

export const addWorkoutRouteSnapshotUriMigration = {
  id: 2,
  name: '002_add_workout_route_snapshot_uri',
  async up(database: SQLiteDatabase): Promise<void> {
    await database.execAsync(`
      ALTER TABLE workouts ADD COLUMN route_snapshot_uri TEXT;
    `);
  },
};
