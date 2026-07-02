import type {
  TargetType,
  Workout,
  WorkoutPoint,
  WorkoutSegment,
  WorkoutStatus,
} from '@/features/workout/workout.types';

export type IntervalTemplate = {
  id: string;
  name: string;
  warmupDuration: number;
  shotTargetType: TargetType;
  shotTargetValue: number;
  shotsCount: number;
  restTargetType: TargetType;
  restTargetValue: number;
  cooldownDuration: number;
  createdAt: string;
  updatedAt: string;
};

export type ActiveWorkoutStatus = 'IDLE' | WorkoutStatus;

export type ActiveWorkoutState = {
  status: ActiveWorkoutStatus;
  workout: Workout | null;
  currentSegment: WorkoutSegment | null;
  segments: WorkoutSegment[];
  points: WorkoutPoint[];
  elapsedSeconds: number;
  distanceMeters: number;
  currentPace: number | null;
  averagePace: number | null;
};
