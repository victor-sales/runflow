import type { SQLiteDatabase } from 'expo-sqlite';

export const initialSchemaMigration = {
  id: 1,
  name: '001_initial_schema',
  async up(database: SQLiteDatabase): Promise<void> {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS workouts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        total_distance REAL DEFAULT 0,
        total_duration INTEGER DEFAULT 0,
        avg_pace INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workout_segments (
        id TEXT PRIMARY KEY,
        workout_id TEXT NOT NULL,
        type TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        repetition INTEGER,
        target_type TEXT NOT NULL,
        target_value INTEGER NOT NULL,
        actual_distance REAL DEFAULT 0,
        actual_duration INTEGER DEFAULT 0,
        avg_pace INTEGER,
        started_at TEXT,
        ended_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (workout_id) REFERENCES workouts(id)
      );

      CREATE TABLE IF NOT EXISTS workout_points (
        id TEXT PRIMARY KEY,
        workout_id TEXT NOT NULL,
        segment_id TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accuracy REAL,
        altitude REAL,
        speed REAL,
        timestamp TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (workout_id) REFERENCES workouts(id),
        FOREIGN KEY (segment_id) REFERENCES workout_segments(id)
      );

      CREATE TABLE IF NOT EXISTS interval_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        warmup_duration INTEGER DEFAULT 0,
        shot_target_type TEXT NOT NULL,
        shot_target_value INTEGER NOT NULL,
        shots_count INTEGER NOT NULL,
        rest_target_type TEXT NOT NULL,
        rest_target_value INTEGER NOT NULL,
        cooldown_duration INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  },
};
