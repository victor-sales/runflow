import { describe, expect, it } from 'vitest';

import type { IntervalTemplate } from '../../../src/features/interval-training/interval.types';
import {
  advanceSegment,
  calculateSegmentProgress,
  createIntervalEngine,
  generateIntervalSegments,
  getCurrentSegment,
  getNextSegment,
  isIntervalWorkoutCompleted,
  updateIntervalEngine,
} from '../../../src/features/interval-training/interval-engine';

const createTemplate = (
  overrides: Partial<IntervalTemplate> = {},
): IntervalTemplate => ({
  cooldownDuration: 300,
  createdAt: '2026-07-02T12:00:00.000Z',
  id: 'template_1',
  name: '6x400m',
  restTargetType: 'TIME',
  restTargetValue: 60,
  shotTargetType: 'DISTANCE',
  shotTargetValue: 400,
  shotsCount: 6,
  updatedAt: '2026-07-02T12:00:00.000Z',
  warmupDuration: 600,
  ...overrides,
});

describe('interval engine', () => {
  it('generates segments for 6x400m with warmup and cooldown', () => {
    const segments = generateIntervalSegments(createTemplate());

    expect(segments).toHaveLength(13);
    expect(segments.map((segment) => segment.type)).toEqual([
      'WARMUP',
      'RUN',
      'REST',
      'RUN',
      'REST',
      'RUN',
      'REST',
      'RUN',
      'REST',
      'RUN',
      'REST',
      'RUN',
      'COOLDOWN',
    ]);
    expect(segments[0]).toMatchObject({
      id: 'segment_0',
      repetition: null,
      targetType: 'TIME',
      targetValue: 600,
      type: 'WARMUP',
    });
    expect(segments[1]).toMatchObject({
      repetition: 1,
      targetType: 'DISTANCE',
      targetValue: 400,
      type: 'RUN',
    });
    expect(segments[11]).toMatchObject({
      repetition: 6,
      type: 'RUN',
    });
    expect(segments[12]).toMatchObject({
      repetition: null,
      targetType: 'TIME',
      targetValue: 300,
      type: 'COOLDOWN',
    });
  });

  it('skips warmup when warmup duration is zero', () => {
    const segments = generateIntervalSegments(
      createTemplate({ warmupDuration: 0 }),
    );

    expect(segments[0]).toMatchObject({
      id: 'segment_0',
      repetition: 1,
      type: 'RUN',
    });
  });

  it('skips cooldown when cooldown duration is zero', () => {
    const segments = generateIntervalSegments(
      createTemplate({ cooldownDuration: 0 }),
    );

    expect(segments.at(-1)).toMatchObject({
      repetition: 6,
      type: 'RUN',
    });
  });

  it('does not add rest after the last run segment', () => {
    const segments = generateIntervalSegments(
      createTemplate({ cooldownDuration: 0, shotsCount: 2, warmupDuration: 0 }),
    );

    expect(segments.map((segment) => segment.type)).toEqual([
      'RUN',
      'REST',
      'RUN',
    ]);
  });

  it('calculates progress by time and advances segment', () => {
    const state = createIntervalEngine(createTemplate());
    const currentSegment = getCurrentSegment(state);

    expect(currentSegment).not.toBeNull();
    expect(
      calculateSegmentProgress(currentSegment!, {
        distanceMeters: 0,
        elapsedSeconds: 300,
      }),
    ).toBe(0.5);

    const nextState = updateIntervalEngine(state, {
      distanceMeters: 0,
      elapsedSeconds: 600,
    });

    expect(getCurrentSegment(nextState)).toMatchObject({
      repetition: 1,
      type: 'RUN',
    });
    expect(getNextSegment(nextState)).toMatchObject({
      repetition: 1,
      type: 'REST',
    });
  });

  it('calculates progress by distance and advances segment', () => {
    let state = createIntervalEngine(createTemplate({ warmupDuration: 0 }));
    const currentSegment = getCurrentSegment(state);

    expect(currentSegment).not.toBeNull();
    expect(
      calculateSegmentProgress(currentSegment!, {
        distanceMeters: 200,
        elapsedSeconds: 0,
      }),
    ).toBe(0.5);

    state = updateIntervalEngine(state, {
      distanceMeters: 400,
      elapsedSeconds: 0,
    });

    expect(getCurrentSegment(state)).toMatchObject({
      repetition: 1,
      type: 'REST',
    });
  });

  it('marks workout as completed after the last segment', () => {
    let state = createIntervalEngine(
      createTemplate({ cooldownDuration: 0, shotsCount: 1, warmupDuration: 0 }),
    );

    state = advanceSegment(state);

    expect(isIntervalWorkoutCompleted(state)).toBe(true);
    expect(getCurrentSegment(state)).toBeNull();
  });
});
