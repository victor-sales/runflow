import {
  calculateSegmentProgress,
  type IntervalEngineSegment,
} from './interval-engine';
import type { LocationPoint } from '@/features/location/location.types';
import type { CreateWorkoutSegmentInput } from '@/features/workout/workout.repository';
import type { WorkoutSegment } from '@/features/workout/workout.types';
import { calculateTotalDistance } from '@/utils/distance';
import { calculateAvgPace } from '@/utils/pace';

export type IntervalWorkoutSegmentSummary = Pick<
  WorkoutSegment,
  'actualDistance' | 'actualDuration' | 'avgPace' | 'endedAt' | 'startedAt'
>;

export type IntervalSegmentRuntime = {
  accumulatedElapsedSeconds: number;
  activeStartedAt: string | null;
  points: LocationPoint[];
  startedAt: string;
};

export type IntervalSegmentRuntimeMetrics = {
  distanceMeters: number;
  elapsedSeconds: number;
  progress: number;
};

export function mapEngineSegmentsToWorkoutSegmentInputs(
  workoutId: string,
  segments: readonly IntervalEngineSegment[],
  firstSegmentStartedAt: string | null = null,
): CreateWorkoutSegmentInput[] {
  return segments.map((segment, index) => ({
    actualDistance: 0,
    actualDuration: 0,
    avgPace: null,
    endedAt: null,
    orderIndex: segment.orderIndex,
    repetition: segment.repetition,
    startedAt: index === 0 ? firstSegmentStartedAt : null,
    targetType: segment.targetType,
    targetValue: segment.targetValue,
    type: segment.type,
    workoutId,
  }));
}

export function createIntervalSegmentRuntime(
  startedAt: string,
): IntervalSegmentRuntime {
  return {
    accumulatedElapsedSeconds: 0,
    activeStartedAt: startedAt,
    points: [],
    startedAt,
  };
}

export function appendIntervalSegmentRuntimePoint(
  runtime: IntervalSegmentRuntime,
  point: LocationPoint,
): IntervalSegmentRuntime {
  return {
    ...runtime,
    points: [...runtime.points, point],
  };
}

export function pauseIntervalSegmentRuntime(
  runtime: IntervalSegmentRuntime,
  pausedAt: string,
): IntervalSegmentRuntime {
  return {
    ...runtime,
    accumulatedElapsedSeconds: getIntervalSegmentElapsedSeconds(
      runtime,
      pausedAt,
    ),
    activeStartedAt: null,
  };
}

export function resumeIntervalSegmentRuntime(
  runtime: IntervalSegmentRuntime,
  resumedAt: string,
): IntervalSegmentRuntime {
  return {
    ...runtime,
    activeStartedAt: resumedAt,
  };
}

export function getIntervalSegmentElapsedSeconds(
  runtime: IntervalSegmentRuntime,
  now: string,
): number {
  if (!runtime.activeStartedAt) {
    return runtime.accumulatedElapsedSeconds;
  }

  return (
    runtime.accumulatedElapsedSeconds +
    getElapsedSeconds(runtime.activeStartedAt, now)
  );
}

export function calculateIntervalSegmentRuntimeMetrics(
  segment: IntervalEngineSegment,
  runtime: IntervalSegmentRuntime,
  now: string,
): IntervalSegmentRuntimeMetrics {
  const distanceMeters = calculateTotalDistance(runtime.points);
  const elapsedSeconds = getIntervalSegmentElapsedSeconds(runtime, now);

  return {
    distanceMeters,
    elapsedSeconds,
    progress: calculateSegmentProgress(segment, {
      distanceMeters,
      elapsedSeconds,
    }),
  };
}

export function calculateIntervalWorkoutSegmentSummary({
  endedAt,
  elapsedSeconds,
  points,
  startedAt,
}: {
  endedAt: string;
  elapsedSeconds: number;
  points: readonly LocationPoint[];
  startedAt: string;
}): IntervalWorkoutSegmentSummary {
  const actualDistance = calculateTotalDistance(points);
  const actualDuration =
    Number.isFinite(elapsedSeconds) && elapsedSeconds > 0
      ? Math.round(elapsedSeconds)
      : 0;

  return {
    actualDistance,
    actualDuration,
    avgPace: calculateAvgPace(actualDuration, actualDistance),
    endedAt,
    startedAt,
  };
}

function getElapsedSeconds(start: string, end: string): number {
  const startMilliseconds = Date.parse(start);
  const endMilliseconds = Date.parse(end);

  if (
    !Number.isFinite(startMilliseconds) ||
    !Number.isFinite(endMilliseconds) ||
    endMilliseconds <= startMilliseconds
  ) {
    return 0;
  }

  return Math.round((endMilliseconds - startMilliseconds) / 1000);
}
