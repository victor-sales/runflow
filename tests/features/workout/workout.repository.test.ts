import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/database/db', () => ({
  withDatabase: vi.fn(),
}));

import { withDatabase } from '@/database/db';

import {
  mapWorkoutPointRow,
  mapWorkoutRow,
  mapWorkoutSegmentRow,
  WorkoutRepository,
} from '../../../src/features/workout/workout.repository';

type DatabaseCallback = Parameters<typeof withDatabase>[0];
type DatabaseArgument = Parameters<DatabaseCallback>[0];

describe('workout repository mappers', () => {
  beforeEach(() => {
    vi.mocked(withDatabase).mockReset();
  });

  it('maps workout rows to domain objects', () => {
    expect(
      mapWorkoutRow({
        avg_pace: 360,
        created_at: '2026-07-02T12:00:00.000Z',
        ended_at: '2026-07-02T12:30:00.000Z',
        id: 'workout_1',
        started_at: '2026-07-02T12:00:00.000Z',
        status: 'COMPLETED',
        total_distance: 5000,
        total_duration: 1800,
        type: 'FREE_RUN',
        updated_at: '2026-07-02T12:30:00.000Z',
      }),
    ).toEqual({
      avgPace: 360,
      createdAt: '2026-07-02T12:00:00.000Z',
      endedAt: '2026-07-02T12:30:00.000Z',
      id: 'workout_1',
      startedAt: '2026-07-02T12:00:00.000Z',
      status: 'COMPLETED',
      totalDistance: 5000,
      totalDuration: 1800,
      type: 'FREE_RUN',
      updatedAt: '2026-07-02T12:30:00.000Z',
    });
  });

  it('maps point and segment rows to domain objects', () => {
    expect(
      mapWorkoutPointRow({
        accuracy: 10,
        altitude: null,
        created_at: '2026-07-02T12:00:00.000Z',
        id: 'point_1',
        latitude: -23,
        longitude: -46,
        segment_id: null,
        speed: 3,
        timestamp: '2026-07-02T12:00:00.000Z',
        workout_id: 'workout_1',
      }),
    ).toMatchObject({
      createdAt: '2026-07-02T12:00:00.000Z',
      segmentId: null,
      workoutId: 'workout_1',
    });

    expect(
      mapWorkoutSegmentRow({
        actual_distance: 1000,
        actual_duration: 360,
        avg_pace: 360,
        created_at: '2026-07-02T12:00:00.000Z',
        ended_at: null,
        id: 'segment_1',
        order_index: 0,
        repetition: null,
        started_at: null,
        target_type: 'DISTANCE',
        target_value: 1000,
        type: 'RUN',
        updated_at: '2026-07-02T12:00:00.000Z',
        workout_id: 'workout_1',
      }),
    ).toMatchObject({
      actualDistance: 1000,
      orderIndex: 0,
      targetType: 'DISTANCE',
      workoutId: 'workout_1',
    });
  });

  it('creates completed workout and points inside one transaction', async () => {
    const runAsync = vi.fn().mockResolvedValue({
      changes: 1,
      lastInsertRowId: 1,
    });
    const withTransactionAsync = vi
      .fn()
      .mockImplementation(async (callback: () => Promise<void>) => callback());
    const database = {
      runAsync,
      withTransactionAsync,
    } as unknown as DatabaseArgument;

    vi.mocked(withDatabase).mockImplementation(async (callback) =>
      callback(database),
    );

    const result = await WorkoutRepository.createCompletedWorkoutWithPoints(
      {
        avgPace: 300,
        endedAt: '2026-07-02T12:30:00.000Z',
        id: 'workout_1',
        startedAt: '2026-07-02T12:00:00.000Z',
        totalDistance: 5000,
        totalDuration: 1500,
        type: 'FREE_RUN',
      },
      [
        {
          accuracy: 10,
          altitude: null,
          id: 'point_1',
          latitude: -23,
          longitude: -46,
          segmentId: null,
          speed: 3,
          timestamp: '2026-07-02T12:00:00.000Z',
        },
      ],
    );

    expect(withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(runAsync).toHaveBeenCalledTimes(2);
    expect(result.workout.status).toBe('COMPLETED');
    expect(result.points).toHaveLength(1);
    expect(result.points[0]).toMatchObject({
      id: 'point_1',
      workoutId: 'workout_1',
    });
  });

  it('gets the latest active workout', async () => {
    const database = {
      getFirstAsync: vi.fn().mockResolvedValue({
        avg_pace: null,
        created_at: '2026-07-02T12:00:00.000Z',
        ended_at: null,
        id: 'workout_1',
        started_at: '2026-07-02T12:00:00.000Z',
        status: 'ACTIVE',
        total_distance: 0,
        total_duration: 0,
        type: 'FREE_RUN',
        updated_at: '2026-07-02T12:00:00.000Z',
      }),
    } as unknown as DatabaseArgument;

    vi.mocked(withDatabase).mockImplementation(async (callback) =>
      callback(database),
    );

    await expect(WorkoutRepository.getActiveWorkout()).resolves.toMatchObject({
      id: 'workout_1',
      status: 'ACTIVE',
    });
  });

  it('does not insert duplicated workout points', async () => {
    const database = {
      getFirstAsync: vi.fn().mockResolvedValue({ id: 'point_1' }),
      runAsync: vi.fn(),
    } as unknown as DatabaseArgument;

    vi.mocked(withDatabase).mockImplementation(async (callback) =>
      callback(database),
    );

    await WorkoutRepository.addWorkoutPoint({
      accuracy: 10,
      altitude: null,
      latitude: -23,
      longitude: -46,
      segmentId: null,
      speed: null,
      timestamp: '2026-07-02T12:00:00.000Z',
      workoutId: 'workout_1',
    });

    expect(database.runAsync).not.toHaveBeenCalled();
  });
});
