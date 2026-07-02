export const TABLES = {
  intervalTemplates: 'interval_templates',
  migrations: 'migrations',
  workoutPoints: 'workout_points',
  workoutSegments: 'workout_segments',
  workouts: 'workouts',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
