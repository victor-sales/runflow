import { create } from 'zustand';

import type { GpsSignalStatus } from '@/features/location/location-quality';
import type { LocationPoint } from '@/features/location/location.types';
import type {
  WorkoutSegment,
  WorkoutStatus,
} from '@/features/workout/workout.types';
import { calculateTotalDistance } from '@/utils/distance';
import { calculateAvgPace, calculateCurrentPace } from '@/utils/pace';

export type ActiveWorkoutStatus = 'IDLE' | WorkoutStatus;

type ActiveWorkoutMetrics = {
  averagePace: number | null;
  currentPace: number | null;
  distanceMeters: number;
  elapsedSeconds: number;
};

type RestoreActiveWorkoutInput = {
  accumulatedElapsedSeconds: number;
  activeStartedAt: string | null;
  endedAt: string | null;
  points: LocationPoint[];
  startedAt: string;
  status: Extract<WorkoutStatus, 'ACTIVE' | 'PAUSED'>;
  workoutId: string;
};

type ActiveWorkoutStoreState = ActiveWorkoutMetrics & {
  accumulatedElapsedSeconds: number;
  activeStartedAt: string | null;
  currentSegment: WorkoutSegment | null;
  endedAt: string | null;
  errorMessage: string | null;
  gpsSignal: GpsSignalStatus;
  gpsSignalMessage: string | null;
  pointGroups: LocationPoint[][];
  points: LocationPoint[];
  segments: WorkoutSegment[];
  startedAt: string | null;
  status: ActiveWorkoutStatus;
  workoutId: string | null;
};

type ActiveWorkoutStoreActions = {
  addPoint: (point: LocationPoint) => void;
  cancelWorkout: () => void;
  finishWorkout: (endedAt?: string) => void;
  pauseWorkout: (pausedAt?: string) => void;
  refreshElapsedSeconds: (now?: string) => void;
  resetWorkout: () => void;
  restoreActiveWorkout: (input: RestoreActiveWorkoutInput) => void;
  resumeWorkout: (resumedAt?: string) => void;
  setCurrentSegment: (segment: WorkoutSegment | null) => void;
  setErrorMessage: (message: string | null) => void;
  setGpsSignal: (signal: GpsSignalStatus, message?: string | null) => void;
  startWorkout: (startedAt?: string, workoutId?: string | null) => void;
  updateMetrics: (elapsedSeconds: number) => void;
};

export type ActiveWorkoutStore = ActiveWorkoutStoreState &
  ActiveWorkoutStoreActions;

const POINT_DEDUPE_EPSILON = 0.0000001;
const RESTORE_POINT_GROUP_GAP_SECONDS = 30;

const initialMetrics: ActiveWorkoutMetrics = {
  averagePace: null,
  currentPace: null,
  distanceMeters: 0,
  elapsedSeconds: 0,
};

const initialState: ActiveWorkoutStoreState = {
  ...initialMetrics,
  accumulatedElapsedSeconds: 0,
  activeStartedAt: null,
  currentSegment: null,
  endedAt: null,
  errorMessage: null,
  gpsSignal: 'lost',
  gpsSignalMessage: null,
  pointGroups: [],
  points: [],
  segments: [],
  startedAt: null,
  status: 'IDLE',
  workoutId: null,
};

function getTimestampSeconds(timestamp: string): number | null {
  const milliseconds = Date.parse(timestamp);

  return Number.isFinite(milliseconds) ? milliseconds / 1000 : null;
}

function getElapsedBetweenSeconds(start: string, end: string): number {
  const startSeconds = getTimestampSeconds(start);
  const endSeconds = getTimestampSeconds(end);

  if (startSeconds === null || endSeconds === null || endSeconds <= startSeconds) {
    return 0;
  }

  return Math.round(endSeconds - startSeconds);
}

function getElapsedSecondsAt(
  state: ActiveWorkoutStoreState,
  now = new Date().toISOString(),
): number {
  if (state.status !== 'ACTIVE' || state.activeStartedAt === null) {
    return state.accumulatedElapsedSeconds;
  }

  return (
    state.accumulatedElapsedSeconds +
    getElapsedBetweenSeconds(state.activeStartedAt, now)
  );
}

function isSamePoint(first: LocationPoint, second: LocationPoint): boolean {
  return (
    first.timestamp === second.timestamp &&
    Math.abs(first.latitude - second.latitude) < POINT_DEDUPE_EPSILON &&
    Math.abs(first.longitude - second.longitude) < POINT_DEDUPE_EPSILON
  );
}

function calculateMetrics(
  pointGroups: readonly LocationPoint[][],
  elapsedSeconds: number,
): ActiveWorkoutMetrics {
  const latestPointGroup = pointGroups.at(-1) ?? [];
  const distanceMeters = pointGroups.reduce(
    (totalDistance, pointGroup) =>
      totalDistance + calculateTotalDistance(pointGroup),
    0,
  );

  return {
    averagePace: calculateAvgPace(elapsedSeconds, distanceMeters),
    currentPace: calculateCurrentPace(latestPointGroup),
    distanceMeters,
    elapsedSeconds,
  };
}

function appendPointToGroups(
  pointGroups: readonly LocationPoint[][],
  point: LocationPoint,
): LocationPoint[][] {
  const groups = pointGroups.length > 0 ? pointGroups.map((group) => [...group]) : [[]];
  const latestGroup = groups.at(-1) ?? [];

  if (latestGroup.some((existingPoint) => isSamePoint(existingPoint, point))) {
    return groups;
  }

  groups[groups.length - 1] = [...latestGroup, point];

  return groups;
}

function buildPointGroups(points: readonly LocationPoint[]): LocationPoint[][] {
  const sortedPoints = [...points].sort(
    (first, second) =>
      Date.parse(first.timestamp) - Date.parse(second.timestamp),
  );
  const pointGroups: LocationPoint[][] = [];

  for (const point of sortedPoints) {
    const latestGroup = pointGroups.at(-1);
    const previousPoint = latestGroup?.at(-1);

    if (!latestGroup || !previousPoint) {
      pointGroups.push([point]);
      continue;
    }

    const gapSeconds = getElapsedBetweenSeconds(
      previousPoint.timestamp,
      point.timestamp,
    );

    if (gapSeconds > RESTORE_POINT_GROUP_GAP_SECONDS) {
      pointGroups.push([point]);
      continue;
    }

    if (!latestGroup.some((existingPoint) => isSamePoint(existingPoint, point))) {
      latestGroup.push(point);
    }
  }

  return pointGroups.length > 0 ? pointGroups : [[]];
}

export const useActiveWorkoutStore = create<ActiveWorkoutStore>((set) => ({
  ...initialState,
  addPoint: (point) =>
    set((state) => {
      if (state.status !== 'ACTIVE') {
        return state;
      }

      if (state.points.some((existingPoint) => isSamePoint(existingPoint, point))) {
        return state;
      }

      const pointGroups = appendPointToGroups(state.pointGroups, point);
      const elapsedSeconds = getElapsedSecondsAt(state, point.timestamp);

      return {
        ...calculateMetrics(pointGroups, elapsedSeconds),
        pointGroups,
        points: [...state.points, point],
      };
    }),
  cancelWorkout: () =>
    set({
      ...initialState,
      endedAt: new Date().toISOString(),
      status: 'CANCELED',
    }),
  finishWorkout: (endedAt = new Date().toISOString()) =>
    set((state) => {
      if (state.status === 'IDLE') {
        return state;
      }

      const elapsedSeconds = getElapsedSecondsAt(state, endedAt);

      return {
        ...calculateMetrics(state.pointGroups, elapsedSeconds),
        accumulatedElapsedSeconds: elapsedSeconds,
        activeStartedAt: null,
        endedAt,
        status: 'COMPLETED',
      };
    }),
  pauseWorkout: (pausedAt = new Date().toISOString()) =>
    set((state) => {
      if (state.status !== 'ACTIVE') {
        return state;
      }

      const elapsedSeconds = getElapsedSecondsAt(state, pausedAt);

      return {
        ...calculateMetrics(state.pointGroups, elapsedSeconds),
        accumulatedElapsedSeconds: elapsedSeconds,
        activeStartedAt: null,
        status: 'PAUSED',
      };
    }),
  refreshElapsedSeconds: (now = new Date().toISOString()) =>
    set((state) => {
      if (state.status !== 'ACTIVE') {
        return state;
      }

      return calculateMetrics(state.pointGroups, getElapsedSecondsAt(state, now));
    }),
  resetWorkout: () => set(initialState),
  restoreActiveWorkout: (input) =>
    set(() => {
      const pointGroups = buildPointGroups(input.points);
      const state: ActiveWorkoutStoreState = {
        ...initialState,
        accumulatedElapsedSeconds: input.accumulatedElapsedSeconds,
        activeStartedAt: input.activeStartedAt,
        endedAt: input.endedAt,
        pointGroups,
        points: input.points,
        startedAt: input.startedAt,
        status: input.status,
        workoutId: input.workoutId,
      };

      return {
        ...state,
        ...calculateMetrics(pointGroups, getElapsedSecondsAt(state)),
      };
    }),
  resumeWorkout: (resumedAt = new Date().toISOString()) =>
    set((state) => {
      if (state.status !== 'PAUSED') {
        return state;
      }

      return {
        activeStartedAt: resumedAt,
        pointGroups:
          state.pointGroups.at(-1)?.length
            ? [...state.pointGroups, []]
            : state.pointGroups.length > 0
              ? state.pointGroups
              : [[]],
        status: 'ACTIVE',
      };
    }),
  setCurrentSegment: (segment) => set({ currentSegment: segment }),
  setErrorMessage: (message) => set({ errorMessage: message }),
  setGpsSignal: (signal, message = null) =>
    set({ gpsSignal: signal, gpsSignalMessage: message }),
  startWorkout: (startedAt = new Date().toISOString(), workoutId = null) =>
    set({
      ...initialState,
      activeStartedAt: startedAt,
      pointGroups: [[]],
      startedAt,
      status: 'ACTIVE',
      workoutId,
    }),
  updateMetrics: (elapsedSeconds) =>
    set((state) => calculateMetrics(state.pointGroups, elapsedSeconds)),
}));
