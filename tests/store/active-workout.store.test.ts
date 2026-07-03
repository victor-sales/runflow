import { beforeEach, describe, expect, it } from 'vitest';

import { useActiveWorkoutStore } from '../../src/store/active-workout.store';

describe('active workout store', () => {
  beforeEach(() => {
    useActiveWorkoutStore.getState().resetWorkout();
  });

  it('starts, pauses, resumes, finishes, and resets a workout', () => {
    const store = useActiveWorkoutStore.getState();

    store.startWorkout('2026-07-02T12:00:00.000Z');
    expect(useActiveWorkoutStore.getState().status).toBe('ACTIVE');

    useActiveWorkoutStore.getState().pauseWorkout();
    expect(useActiveWorkoutStore.getState().status).toBe('PAUSED');

    useActiveWorkoutStore.getState().resumeWorkout();
    expect(useActiveWorkoutStore.getState().status).toBe('ACTIVE');

    useActiveWorkoutStore.getState().finishWorkout('2026-07-02T12:05:00.000Z');
    expect(useActiveWorkoutStore.getState().status).toBe('COMPLETED');

    useActiveWorkoutStore.getState().resetWorkout();
    expect(useActiveWorkoutStore.getState().status).toBe('IDLE');
  });

  it('adds points only while active and updates distance metrics', () => {
    useActiveWorkoutStore.getState().addPoint({
      accuracy: 10,
      altitude: null,
      latitude: 0,
      longitude: 0,
      speed: null,
      timestamp: '2026-07-02T12:00:00.000Z',
    });

    expect(useActiveWorkoutStore.getState().points).toHaveLength(0);

    useActiveWorkoutStore.getState().startWorkout('2026-07-02T12:00:00.000Z');
    useActiveWorkoutStore.getState().updateMetrics(20);
    useActiveWorkoutStore.getState().addPoint({
      accuracy: 10,
      altitude: null,
      latitude: 0,
      longitude: 0,
      speed: null,
      timestamp: '2026-07-02T12:00:00.000Z',
    });
    useActiveWorkoutStore.getState().addPoint({
      accuracy: 10,
      altitude: null,
      latitude: 0,
      longitude: 0.001,
      speed: null,
      timestamp: '2026-07-02T12:00:20.000Z',
    });

    expect(useActiveWorkoutStore.getState().points).toHaveLength(2);
    expect(useActiveWorkoutStore.getState().distanceMeters).toBeGreaterThan(
      100,
    );
    expect(useActiveWorkoutStore.getState().averagePace).toBeGreaterThan(0);
  });

  it('updates gps signal state', () => {
    useActiveWorkoutStore
      .getState()
      .setGpsSignal('weak', 'Sinal de GPS fraco.');

    expect(useActiveWorkoutStore.getState().gpsSignal).toBe('weak');
    expect(useActiveWorkoutStore.getState().gpsSignalMessage).toBe(
      'Sinal de GPS fraco.',
    );
  });

  it('refreshes elapsed time from timestamps instead of incremental ticks', () => {
    useActiveWorkoutStore
      .getState()
      .startWorkout('2026-07-02T12:00:00.000Z', 'workout_1');

    useActiveWorkoutStore
      .getState()
      .refreshElapsedSeconds('2026-07-02T12:05:00.000Z');

    expect(useActiveWorkoutStore.getState().elapsedSeconds).toBe(300);
  });

  it('keeps elapsed time stable while paused and resumes from accumulated time', () => {
    useActiveWorkoutStore
      .getState()
      .startWorkout('2026-07-02T12:00:00.000Z', 'workout_1');
    useActiveWorkoutStore.getState().pauseWorkout('2026-07-02T12:05:00.000Z');
    useActiveWorkoutStore
      .getState()
      .refreshElapsedSeconds('2026-07-02T12:10:00.000Z');

    expect(useActiveWorkoutStore.getState().elapsedSeconds).toBe(300);

    useActiveWorkoutStore.getState().resumeWorkout('2026-07-02T12:10:00.000Z');
    useActiveWorkoutStore
      .getState()
      .refreshElapsedSeconds('2026-07-02T12:12:00.000Z');

    expect(useActiveWorkoutStore.getState().elapsedSeconds).toBe(420);
  });

  it('deduplicates repeated gps points', () => {
    const point = {
      accuracy: 10,
      altitude: null,
      latitude: 0,
      longitude: 0,
      speed: null,
      timestamp: '2026-07-02T12:00:00.000Z',
    };

    useActiveWorkoutStore
      .getState()
      .startWorkout('2026-07-02T12:00:00.000Z', 'workout_1');
    useActiveWorkoutStore.getState().addPoint(point);
    useActiveWorkoutStore.getState().addPoint(point);

    expect(useActiveWorkoutStore.getState().points).toHaveLength(1);
  });

  it('does not connect points across pause and resume', () => {
    useActiveWorkoutStore.getState().startWorkout('2026-07-02T12:00:00.000Z');
    useActiveWorkoutStore.getState().updateMetrics(20);
    useActiveWorkoutStore.getState().addPoint({
      accuracy: 10,
      altitude: null,
      latitude: 0,
      longitude: 0,
      speed: null,
      timestamp: '2026-07-02T12:00:00.000Z',
    });
    useActiveWorkoutStore.getState().addPoint({
      accuracy: 10,
      altitude: null,
      latitude: 0,
      longitude: 0.001,
      speed: null,
      timestamp: '2026-07-02T12:00:20.000Z',
    });

    useActiveWorkoutStore.getState().pauseWorkout();
    useActiveWorkoutStore.getState().resumeWorkout();
    useActiveWorkoutStore.getState().addPoint({
      accuracy: 10,
      altitude: null,
      latitude: 0,
      longitude: 0.1,
      speed: null,
      timestamp: '2026-07-02T12:10:00.000Z',
    });
    useActiveWorkoutStore.getState().addPoint({
      accuracy: 10,
      altitude: null,
      latitude: 0,
      longitude: 0.101,
      speed: null,
      timestamp: '2026-07-02T12:10:20.000Z',
    });

    expect(useActiveWorkoutStore.getState().points).toHaveLength(4);
    expect(useActiveWorkoutStore.getState().pointGroups).toHaveLength(2);
    expect(useActiveWorkoutStore.getState().distanceMeters).toBeGreaterThan(
      200,
    );
    expect(useActiveWorkoutStore.getState().distanceMeters).toBeLessThan(250);
  });
});
