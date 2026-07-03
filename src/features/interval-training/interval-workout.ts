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
  pointGroups: LocationPoint[][];
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
    pointGroups: [[]],
    points: [],
    startedAt,
  };
}

export function appendIntervalSegmentRuntimePoint(
  runtime: IntervalSegmentRuntime,
  point: LocationPoint,
): IntervalSegmentRuntime {
  const pointGroups = appendPointToGroups(runtime.pointGroups, point);

  return {
    ...runtime,
    pointGroups,
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
    pointGroups: runtime.pointGroups.at(-1)?.length
      ? [...runtime.pointGroups, []]
      : runtime.pointGroups.length > 0
        ? runtime.pointGroups
        : [[]],
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
  const distanceMeters = calculateTotalDistanceFromGroups(runtime.pointGroups);
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
  pointGroups,
  startedAt,
}: {
  endedAt: string;
  elapsedSeconds: number;
  pointGroups: readonly LocationPoint[][];
  startedAt: string;
}): IntervalWorkoutSegmentSummary {
  const actualDistance = calculateTotalDistanceFromGroups(pointGroups);
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

function appendPointToGroups(
  pointGroups: readonly LocationPoint[][],
  point: LocationPoint,
): LocationPoint[][] {
  const groups =
    pointGroups.length > 0 ? pointGroups.map((group) => [...group]) : [[]];
  const latestGroup = groups.at(-1) ?? [];

  groups[groups.length - 1] = [...latestGroup, point];

  return groups;
}

function calculateTotalDistanceFromGroups(
  pointGroups: readonly LocationPoint[][],
): number {
  return pointGroups.reduce(
    (totalDistance, pointGroup) =>
      totalDistance + calculateTotalDistance(pointGroup),
    0,
  );
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
