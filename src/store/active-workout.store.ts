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

type ActiveWorkoutStoreState = ActiveWorkoutMetrics & {
  currentSegment: WorkoutSegment | null;
  endedAt: string | null;
  errorMessage: string | null;
  gpsSignal: GpsSignalStatus;
  gpsSignalMessage: string | null;
  points: LocationPoint[];
  segments: WorkoutSegment[];
  startedAt: string | null;
  status: ActiveWorkoutStatus;
};

type ActiveWorkoutStoreActions = {
  addPoint: (point: LocationPoint) => void;
  cancelWorkout: () => void;
  finishWorkout: (endedAt?: string) => void;
  pauseWorkout: () => void;
  resetWorkout: () => void;
  resumeWorkout: () => void;
  setCurrentSegment: (segment: WorkoutSegment | null) => void;
  setErrorMessage: (message: string | null) => void;
  setGpsSignal: (signal: GpsSignalStatus, message?: string | null) => void;
  startWorkout: (startedAt?: string) => void;
  updateMetrics: (elapsedSeconds: number) => void;
};

export type ActiveWorkoutStore = ActiveWorkoutStoreState &
  ActiveWorkoutStoreActions;

const initialMetrics: ActiveWorkoutMetrics = {
  averagePace: null,
  currentPace: null,
  distanceMeters: 0,
  elapsedSeconds: 0,
};

const initialState: ActiveWorkoutStoreState = {
  ...initialMetrics,
  currentSegment: null,
  endedAt: null,
  errorMessage: null,
  gpsSignal: 'lost',
  gpsSignalMessage: null,
  points: [],
  segments: [],
  startedAt: null,
  status: 'IDLE',
};

function calculateMetrics(
  points: readonly LocationPoint[],
  elapsedSeconds: number,
): ActiveWorkoutMetrics {
  const distanceMeters = calculateTotalDistance(points);

  return {
    averagePace: calculateAvgPace(elapsedSeconds, distanceMeters),
    currentPace: calculateCurrentPace(points),
    distanceMeters,
    elapsedSeconds,
  };
}

export const useActiveWorkoutStore = create<ActiveWorkoutStore>((set) => ({
  ...initialState,
  addPoint: (point) =>
    set((state) => {
      if (state.status !== 'ACTIVE') {
        return state;
      }

      const points = [...state.points, point];

      return {
        ...calculateMetrics(points, state.elapsedSeconds),
        points,
      };
    }),
  cancelWorkout: () =>
    set({
      ...initialState,
      endedAt: new Date().toISOString(),
      status: 'CANCELED',
    }),
  finishWorkout: (endedAt = new Date().toISOString()) =>
    set((state) => ({
      endedAt,
      status: state.status === 'IDLE' ? 'IDLE' : 'COMPLETED',
    })),
  pauseWorkout: () =>
    set((state) => ({
      status: state.status === 'ACTIVE' ? 'PAUSED' : state.status,
    })),
  resetWorkout: () => set(initialState),
  resumeWorkout: () =>
    set((state) => ({
      status: state.status === 'PAUSED' ? 'ACTIVE' : state.status,
    })),
  setCurrentSegment: (segment) => set({ currentSegment: segment }),
  setErrorMessage: (message) => set({ errorMessage: message }),
  setGpsSignal: (signal, message = null) =>
    set({ gpsSignal: signal, gpsSignalMessage: message }),
  startWorkout: (startedAt = new Date().toISOString()) =>
    set({
      ...initialState,
      startedAt,
      status: 'ACTIVE',
    }),
  updateMetrics: (elapsedSeconds) =>
    set((state) => calculateMetrics(state.points, elapsedSeconds)),
}));
