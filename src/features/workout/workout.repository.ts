import type { SQLiteDatabase } from 'expo-sqlite';

import { withDatabase } from '@/database/db';
import { TABLES } from '@/database/schema';
import type {
  SegmentType,
  TargetType,
  Workout,
  WorkoutPoint,
  WorkoutSegment,
  WorkoutStatus,
  WorkoutType,
} from '@/features/workout/workout.types';
import { createId } from '@/utils/id';

const POINT_COORDINATE_EPSILON = 0.0000001;

type WorkoutRow = {
  id: string;
  type: WorkoutType;
  status: WorkoutStatus;
  started_at: string;
  ended_at: string | null;
  total_distance: number;
  total_duration: number;
  avg_pace: number | null;
  created_at: string;
  updated_at: string;
};

type WorkoutPointRow = {
  id: string;
  workout_id: string;
  segment_id: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  timestamp: string;
  created_at: string;
};

type WorkoutSegmentRow = {
  id: string;
  workout_id: string;
  type: SegmentType;
  order_index: number;
  repetition: number | null;
  target_type: TargetType;
  target_value: number;
  actual_distance: number;
  actual_duration: number;
  avg_pace: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateWorkoutInput = {
  id?: string;
  type: WorkoutType;
  status?: WorkoutStatus;
  startedAt: string;
  endedAt?: string | null;
  totalDistance?: number;
  totalDuration?: number;
  avgPace?: number | null;
};

export type UpdateWorkoutInput = Partial<
  Pick<
    Workout,
    'status' | 'endedAt' | 'totalDistance' | 'totalDuration' | 'avgPace'
  >
>;

export type CreateWorkoutPointInput = Omit<WorkoutPoint, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: string;
};

export type CreateWorkoutSegmentInput = Omit<
  WorkoutSegment,
  'id' | 'createdAt' | 'updatedAt'
> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateWorkoutSegmentInput = Partial<
  Pick<
    WorkoutSegment,
    'actualDistance' | 'actualDuration' | 'avgPace' | 'endedAt' | 'startedAt'
  >
>;

export type CreateCompletedWorkoutWithPointsInput = Omit<
  CreateWorkoutInput,
  'status'
> & {
  endedAt: string;
};

export type CompletedWorkoutWithPoints = {
  points: WorkoutPoint[];
  workout: Workout;
};

export function mapWorkoutRow(row: WorkoutRow): Workout {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    totalDistance: row.total_distance,
    totalDuration: row.total_duration,
    avgPace: row.avg_pace,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWorkoutPointRow(row: WorkoutPointRow): WorkoutPoint {
  return {
    id: row.id,
    workoutId: row.workout_id,
    segmentId: row.segment_id,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracy: row.accuracy,
    altitude: row.altitude,
    speed: row.speed,
    timestamp: row.timestamp,
    createdAt: row.created_at,
  };
}

export function mapWorkoutSegmentRow(row: WorkoutSegmentRow): WorkoutSegment {
  return {
    id: row.id,
    workoutId: row.workout_id,
    type: row.type,
    orderIndex: row.order_index,
    repetition: row.repetition,
    targetType: row.target_type,
    targetValue: row.target_value,
    actualDistance: row.actual_distance,
    actualDuration: row.actual_duration,
    avgPace: row.avg_pace,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildWorkout(input: CreateWorkoutInput, now: string): Workout {
  return {
    id: input.id ?? createId('workout'),
    type: input.type,
    status: input.status ?? 'ACTIVE',
    startedAt: input.startedAt,
    endedAt: input.endedAt ?? null,
    totalDistance: input.totalDistance ?? 0,
    totalDuration: input.totalDuration ?? 0,
    avgPace: input.avgPace ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

async function insertWorkout(
  database: Pick<SQLiteDatabase, 'runAsync'>,
  workout: Workout,
): Promise<void> {
  await database.runAsync(
    `INSERT INTO ${TABLES.workouts}
      (id, type, status, started_at, ended_at, total_distance, total_duration, avg_pace, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    workout.id,
    workout.type,
    workout.status,
    workout.startedAt,
    workout.endedAt,
    workout.totalDistance,
    workout.totalDuration,
    workout.avgPace,
    workout.createdAt,
    workout.updatedAt,
  );
}

function buildWorkoutPoint(
  input: CreateWorkoutPointInput,
  createdAt: string,
): WorkoutPoint {
  return {
    id: input.id ?? createId('point'),
    workoutId: input.workoutId,
    segmentId: input.segmentId,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: input.accuracy,
    altitude: input.altitude,
    speed: input.speed,
    timestamp: input.timestamp,
    createdAt: input.createdAt ?? createdAt,
  };
}

async function insertWorkoutPoint(
  database: Pick<SQLiteDatabase, 'runAsync'>,
  point: WorkoutPoint,
): Promise<void> {
  await database.runAsync(
    `INSERT INTO ${TABLES.workoutPoints}
      (id, workout_id, segment_id, latitude, longitude, accuracy, altitude, speed, timestamp, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    point.id,
    point.workoutId,
    point.segmentId,
    point.latitude,
    point.longitude,
    point.accuracy,
    point.altitude,
    point.speed,
    point.timestamp,
    point.createdAt,
  );
}

async function hasWorkoutPoint(
  database: Pick<SQLiteDatabase, 'getFirstAsync'>,
  point: WorkoutPoint,
): Promise<boolean> {
  const row = await database.getFirstAsync<{ id: string }>(
    `SELECT id FROM ${TABLES.workoutPoints}
     WHERE workout_id = ?
       AND timestamp = ?
       AND ABS(latitude - ?) < ?
       AND ABS(longitude - ?) < ?
     LIMIT 1;`,
    point.workoutId,
    point.timestamp,
    point.latitude,
    POINT_COORDINATE_EPSILON,
    point.longitude,
    POINT_COORDINATE_EPSILON,
  );

  return row !== null;
}

async function insertWorkoutPointIfNew(
  database: Pick<SQLiteDatabase, 'getFirstAsync' | 'runAsync'>,
  point: WorkoutPoint,
): Promise<void> {
  if (await hasWorkoutPoint(database, point)) {
    return;
  }

  await insertWorkoutPoint(database, point);
}

async function getWorkoutById(id: string): Promise<Workout | null> {
  return withDatabase(async (database) => {
    const row = await database.getFirstAsync<WorkoutRow>(
      `SELECT * FROM ${TABLES.workouts} WHERE id = ?;`,
      id,
    );

    return row ? mapWorkoutRow(row) : null;
  });
}

async function getActiveWorkout(): Promise<Workout | null> {
  return withDatabase(async (database) => {
    const row = await database.getFirstAsync<WorkoutRow>(
      `SELECT * FROM ${TABLES.workouts}
       WHERE status = ?
       ORDER BY started_at DESC
       LIMIT 1;`,
      'ACTIVE',
    );

    return row ? mapWorkoutRow(row) : null;
  });
}

async function getOpenWorkout(type?: WorkoutType): Promise<Workout | null> {
  return withDatabase(async (database) => {
    const typeFilter = type ? 'AND type = ?' : '';
    const params = type ? ['ACTIVE', 'PAUSED', type] : ['ACTIVE', 'PAUSED'];
    const rows = await database.getAllAsync<WorkoutRow>(
      `SELECT * FROM ${TABLES.workouts}
       WHERE status IN (?, ?)
       ${typeFilter}
       ORDER BY started_at DESC
       LIMIT 1;`,
      ...params,
    );

    const row = rows[0];

    return row ? mapWorkoutRow(row) : null;
  });
}

async function createWorkout(input: CreateWorkoutInput): Promise<Workout> {
  const now = new Date().toISOString();
  const workout = buildWorkout(input, now);

  await withDatabase((database) => insertWorkout(database, workout));

  return workout;
}

async function updateWorkout(
  id: string,
  input: UpdateWorkoutInput,
): Promise<Workout | null> {
  const current = await getWorkoutById(id);

  if (!current) {
    return null;
  }

  const updated: Workout = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await withDatabase((database) =>
    database.runAsync(
      `UPDATE ${TABLES.workouts}
       SET status = ?, ended_at = ?, total_distance = ?, total_duration = ?, avg_pace = ?, updated_at = ?
       WHERE id = ?;`,
      updated.status,
      updated.endedAt,
      updated.totalDistance,
      updated.totalDuration,
      updated.avgPace,
      updated.updatedAt,
      id,
    ),
  );

  return updated;
}

async function finishWorkout(
  id: string,
  input: Omit<UpdateWorkoutInput, 'status'>,
): Promise<Workout | null> {
  return updateWorkout(id, { ...input, status: 'COMPLETED' });
}

async function cancelWorkout(id: string): Promise<Workout | null> {
  return updateWorkout(id, {
    endedAt: new Date().toISOString(),
    status: 'CANCELED',
  });
}

async function listCompletedWorkouts(): Promise<Workout[]> {
  return withDatabase(async (database) => {
    const rows = await database.getAllAsync<WorkoutRow>(
      `SELECT * FROM ${TABLES.workouts} WHERE status = ? ORDER BY started_at DESC;`,
      'COMPLETED',
    );

    return rows.map(mapWorkoutRow);
  });
}

async function deleteWorkout(id: string): Promise<void> {
  await withDatabase((database) =>
    database.withTransactionAsync(async () => {
      await database.runAsync(
        `DELETE FROM ${TABLES.workoutPoints} WHERE workout_id = ?;`,
        id,
      );
      await database.runAsync(
        `DELETE FROM ${TABLES.workoutSegments} WHERE workout_id = ?;`,
        id,
      );
      await database.runAsync(
        `DELETE FROM ${TABLES.workouts} WHERE id = ?;`,
        id,
      );
    }),
  );
}

async function addWorkoutPoint(
  input: CreateWorkoutPointInput,
): Promise<WorkoutPoint> {
  const point = buildWorkoutPoint(input, new Date().toISOString());

  await withDatabase((database) => insertWorkoutPointIfNew(database, point));

  return point;
}

async function addWorkoutPoints(
  workoutId: string,
  points: readonly Omit<CreateWorkoutPointInput, 'workoutId'>[],
): Promise<WorkoutPoint[]> {
  const createdAt = new Date().toISOString();
  const workoutPoints = points.map((point) => ({
    ...point,
    createdAt,
    workoutId,
  }));

  await withDatabase((database) =>
    database.withTransactionAsync(async () => {
      for (const point of workoutPoints) {
        await insertWorkoutPointIfNew(
          database,
          buildWorkoutPoint(point, createdAt),
        );
      }
    }),
  );

  return getWorkoutPoints(workoutId);
}

async function createCompletedWorkoutWithPoints(
  input: CreateCompletedWorkoutWithPointsInput,
  points: readonly Omit<CreateWorkoutPointInput, 'workoutId'>[],
): Promise<CompletedWorkoutWithPoints> {
  const now = new Date().toISOString();
  const workout = buildWorkout(
    {
      ...input,
      status: 'COMPLETED',
    },
    now,
  );
  const workoutPoints = points.map((point) =>
    buildWorkoutPoint(
      {
        ...point,
        workoutId: workout.id,
      },
      now,
    ),
  );

  await withDatabase((database) =>
    database.withTransactionAsync(async () => {
      await insertWorkout(database, workout);

      for (const point of workoutPoints) {
        await insertWorkoutPoint(database, point);
      }
    }),
  );

  return {
    points: workoutPoints,
    workout,
  };
}

async function getWorkoutPoints(workoutId: string): Promise<WorkoutPoint[]> {
  return withDatabase(async (database) => {
    const rows = await database.getAllAsync<WorkoutPointRow>(
      `SELECT * FROM ${TABLES.workoutPoints} WHERE workout_id = ? ORDER BY timestamp ASC;`,
      workoutId,
    );

    return rows.map(mapWorkoutPointRow);
  });
}

async function addWorkoutSegments(
  segments: readonly CreateWorkoutSegmentInput[],
): Promise<WorkoutSegment[]> {
  const now = new Date().toISOString();
  const workoutSegments = segments.map((segment) => ({
    ...segment,
    id: segment.id ?? createId('segment'),
    createdAt: segment.createdAt ?? now,
    updatedAt: segment.updatedAt ?? now,
  }));

  await withDatabase((database) =>
    database.withTransactionAsync(async () => {
      for (const segment of workoutSegments) {
        await database.runAsync(
          `INSERT INTO ${TABLES.workoutSegments}
            (id, workout_id, type, order_index, repetition, target_type, target_value, actual_distance, actual_duration, avg_pace, started_at, ended_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          segment.id,
          segment.workoutId,
          segment.type,
          segment.orderIndex,
          segment.repetition,
          segment.targetType,
          segment.targetValue,
          segment.actualDistance,
          segment.actualDuration,
          segment.avgPace,
          segment.startedAt,
          segment.endedAt,
          segment.createdAt,
          segment.updatedAt,
        );
      }
    }),
  );

  return workoutSegments;
}

async function getWorkoutSegments(
  workoutId: string,
): Promise<WorkoutSegment[]> {
  return withDatabase(async (database) => {
    const rows = await database.getAllAsync<WorkoutSegmentRow>(
      `SELECT * FROM ${TABLES.workoutSegments} WHERE workout_id = ? ORDER BY order_index ASC;`,
      workoutId,
    );

    return rows.map(mapWorkoutSegmentRow);
  });
}

async function getWorkoutSegmentById(
  id: string,
): Promise<WorkoutSegment | null> {
  return withDatabase(async (database) => {
    const row = await database.getFirstAsync<WorkoutSegmentRow>(
      `SELECT * FROM ${TABLES.workoutSegments} WHERE id = ?;`,
      id,
    );

    return row ? mapWorkoutSegmentRow(row) : null;
  });
}

async function updateWorkoutSegment(
  id: string,
  input: UpdateWorkoutSegmentInput,
): Promise<WorkoutSegment | null> {
  const current = await getWorkoutSegmentById(id);

  if (!current) {
    return null;
  }

  const updated: WorkoutSegment = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await withDatabase((database) =>
    database.runAsync(
      `UPDATE ${TABLES.workoutSegments}
       SET actual_distance = ?, actual_duration = ?, avg_pace = ?, started_at = ?, ended_at = ?, updated_at = ?
       WHERE id = ?;`,
      updated.actualDistance,
      updated.actualDuration,
      updated.avgPace,
      updated.startedAt,
      updated.endedAt,
      updated.updatedAt,
      id,
    ),
  );

  return updated;
}

export const WorkoutRepository = {
  addWorkoutPoint,
  addWorkoutPoints,
  addWorkoutSegments,
  cancelWorkout,
  createCompletedWorkoutWithPoints,
  createWorkout,
  deleteWorkout,
  finishWorkout,
  getActiveWorkout,
  getOpenWorkout,
  getWorkoutById,
  getWorkoutPoints,
  getWorkoutSegments,
  listCompletedWorkouts,
  updateWorkoutSegment,
  updateWorkout,
};
