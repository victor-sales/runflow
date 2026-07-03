import type { IntervalTemplate } from './interval.types';
import type { SegmentType, TargetType } from '@/features/workout/workout.types';

export type IntervalEngineStatus = 'ACTIVE' | 'COMPLETED';

export type IntervalEngineSegment = {
  id: string;
  type: SegmentType;
  orderIndex: number;
  repetition: number | null;
  targetType: TargetType;
  targetValue: number;
};

export type IntervalSegmentMetrics = {
  elapsedSeconds: number;
  distanceMeters: number;
};

export type IntervalEngineState = {
  segments: IntervalEngineSegment[];
  currentSegmentIndex: number;
  status: IntervalEngineStatus;
};

const clampProgress = (progress: number): number =>
  Math.min(Math.max(progress, 0), 1);

const isPositiveTarget = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

const createSegment = (
  type: SegmentType,
  orderIndex: number,
  repetition: number | null,
  targetType: TargetType,
  targetValue: number,
): IntervalEngineSegment => ({
  id: `segment_${orderIndex}`,
  orderIndex,
  repetition,
  targetType,
  targetValue,
  type,
});

export const generateIntervalSegments = (
  template: IntervalTemplate,
): IntervalEngineSegment[] => {
  const segments: IntervalEngineSegment[] = [];
  let orderIndex = 0;

  if (template.warmupDuration > 0) {
    segments.push(
      createSegment(
        'WARMUP',
        orderIndex,
        null,
        'TIME',
        template.warmupDuration,
      ),
    );
    orderIndex += 1;
  }

  const shotsCount = Math.max(0, Math.floor(template.shotsCount));

  for (let repetition = 1; repetition <= shotsCount; repetition += 1) {
    segments.push(
      createSegment(
        'RUN',
        orderIndex,
        repetition,
        template.shotTargetType,
        template.shotTargetValue,
      ),
    );
    orderIndex += 1;

    if (repetition < shotsCount) {
      segments.push(
        createSegment(
          'REST',
          orderIndex,
          repetition,
          template.restTargetType,
          template.restTargetValue,
        ),
      );
      orderIndex += 1;
    }
  }

  if (template.cooldownDuration > 0) {
    segments.push(
      createSegment(
        'COOLDOWN',
        orderIndex,
        null,
        'TIME',
        template.cooldownDuration,
      ),
    );
  }

  return segments;
};

export const createIntervalEngine = (
  template: IntervalTemplate,
): IntervalEngineState => {
  const segments = generateIntervalSegments(template);

  return {
    currentSegmentIndex: segments.length === 0 ? 0 : 0,
    segments,
    status: segments.length === 0 ? 'COMPLETED' : 'ACTIVE',
  };
};

export const getCurrentSegment = (
  state: IntervalEngineState,
): IntervalEngineSegment | null => {
  if (state.status === 'COMPLETED') {
    return null;
  }

  return state.segments[state.currentSegmentIndex] ?? null;
};

export const getNextSegment = (
  state: IntervalEngineState,
): IntervalEngineSegment | null =>
  state.segments[state.currentSegmentIndex + 1] ?? null;

export const calculateSegmentProgress = (
  segment: IntervalEngineSegment,
  metrics: IntervalSegmentMetrics,
): number => {
  if (!isPositiveTarget(segment.targetValue)) {
    return 0;
  }

  const currentValue =
    segment.targetType === 'TIME'
      ? metrics.elapsedSeconds
      : metrics.distanceMeters;

  if (!Number.isFinite(currentValue) || currentValue <= 0) {
    return 0;
  }

  return clampProgress(currentValue / segment.targetValue);
};

export const advanceSegment = (
  state: IntervalEngineState,
): IntervalEngineState => {
  if (state.status === 'COMPLETED') {
    return state;
  }

  const nextSegmentIndex = state.currentSegmentIndex + 1;

  if (nextSegmentIndex >= state.segments.length) {
    return {
      ...state,
      currentSegmentIndex: state.segments.length,
      status: 'COMPLETED',
    };
  }

  return {
    ...state,
    currentSegmentIndex: nextSegmentIndex,
  };
};

export const updateIntervalEngine = (
  state: IntervalEngineState,
  metrics: IntervalSegmentMetrics,
): IntervalEngineState => {
  const currentSegment = getCurrentSegment(state);

  if (currentSegment === null) {
    return {
      ...state,
      currentSegmentIndex: state.segments.length,
      status: 'COMPLETED',
    };
  }

  if (calculateSegmentProgress(currentSegment, metrics) < 1) {
    return state;
  }

  return advanceSegment(state);
};

export const isIntervalWorkoutCompleted = (
  state: IntervalEngineState,
): boolean => state.status === 'COMPLETED';
