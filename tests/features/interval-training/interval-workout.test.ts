import { describe, expect, it } from 'vitest';

import type { IntervalEngineSegment } from '../../../src/features/interval-training/interval-engine';
import {
  appendIntervalSegmentRuntimePoint,
  calculateIntervalSegmentRuntimeMetrics,
  calculateIntervalWorkoutSegmentSummary,
  createIntervalSegmentRuntime,
  mapEngineSegmentsToWorkoutSegmentInputs,
  pauseIntervalSegmentRuntime,
  resumeIntervalSegmentRuntime,
} from '../../../src/features/interval-training/interval-workout';

describe('interval workout helpers', () => {
  it('maps engine segments to workout segment inputs', () => {
    const segments: IntervalEngineSegment[] = [
      {
        id: 'segment_0',
        orderIndex: 0,
        repetition: null,
        targetType: 'TIME',
        targetValue: 600,
        type: 'WARMUP',
      },
      {
        id: 'segment_1',
        orderIndex: 1,
        repetition: 1,
        targetType: 'DISTANCE',
        targetValue: 400,
        type: 'RUN',
      },
    ];

    expect(
      mapEngineSegmentsToWorkoutSegmentInputs(
        'workout_1',
        segments,
        '2026-07-02T12:00:00.000Z',
      ),
    ).toEqual([
      {
        actualDistance: 0,
        actualDuration: 0,
        avgPace: null,
        endedAt: null,
        orderIndex: 0,
        repetition: null,
        startedAt: '2026-07-02T12:00:00.000Z',
        targetType: 'TIME',
        targetValue: 600,
        type: 'WARMUP',
        workoutId: 'workout_1',
      },
      {
        actualDistance: 0,
        actualDuration: 0,
        avgPace: null,
        endedAt: null,
        orderIndex: 1,
        repetition: 1,
        startedAt: null,
        targetType: 'DISTANCE',
        targetValue: 400,
        type: 'RUN',
        workoutId: 'workout_1',
      },
    ]);
  });

  it('calculates segment summary from points and elapsed seconds', () => {
    const summary = calculateIntervalWorkoutSegmentSummary({
      elapsedSeconds: 100,
      endedAt: '2026-07-02T12:01:40.000Z',
      points: [
        {
          accuracy: 10,
          altitude: null,
          latitude: 0,
          longitude: 0,
          speed: null,
          timestamp: '2026-07-02T12:00:00.000Z',
        },
        {
          accuracy: 10,
          altitude: null,
          latitude: 0,
          longitude: 0.0036,
          speed: null,
          timestamp: '2026-07-02T12:01:40.000Z',
        },
      ],
      startedAt: '2026-07-02T12:00:00.000Z',
    });

    expect(summary.actualDistance).toBeGreaterThan(390);
    expect(summary.actualDistance).toBeLessThan(410);
    expect(summary.actualDuration).toBe(100);
    expect(summary.avgPace).toBeGreaterThan(0);
  });

  it('tracks runtime elapsed seconds across pause and resume', () => {
    const runtime = createIntervalSegmentRuntime(
      '2026-07-02T12:00:00.000Z',
    );
    const pausedRuntime = pauseIntervalSegmentRuntime(
      runtime,
      '2026-07-02T12:01:00.000Z',
    );
    const resumedRuntime = resumeIntervalSegmentRuntime(
      pausedRuntime,
      '2026-07-02T12:03:00.000Z',
    );
    const segment: IntervalEngineSegment = {
      id: 'segment_0',
      orderIndex: 0,
      repetition: null,
      targetType: 'TIME',
      targetValue: 120,
      type: 'WARMUP',
    };

    expect(
      calculateIntervalSegmentRuntimeMetrics(
        segment,
        resumedRuntime,
        '2026-07-02T12:04:00.000Z',
      ),
    ).toMatchObject({
      elapsedSeconds: 120,
      progress: 1,
    });
  });

  it('calculates distance progress from runtime points', () => {
    const runtime = appendIntervalSegmentRuntimePoint(
      appendIntervalSegmentRuntimePoint(
        createIntervalSegmentRuntime('2026-07-02T12:00:00.000Z'),
        {
          accuracy: 10,
          altitude: null,
          latitude: 0,
          longitude: 0,
          speed: null,
          timestamp: '2026-07-02T12:00:00.000Z',
        },
      ),
      {
        accuracy: 10,
        altitude: null,
        latitude: 0,
        longitude: 0.0036,
        speed: null,
        timestamp: '2026-07-02T12:01:40.000Z',
      },
    );
    const segment: IntervalEngineSegment = {
      id: 'segment_1',
      orderIndex: 1,
      repetition: 1,
      targetType: 'DISTANCE',
      targetValue: 400,
      type: 'RUN',
    };

    const metrics = calculateIntervalSegmentRuntimeMetrics(
      segment,
      runtime,
      '2026-07-02T12:01:40.000Z',
    );

    expect(metrics.distanceMeters).toBeGreaterThan(390);
    expect(metrics.progress).toBeGreaterThan(0.95);
  });
});
