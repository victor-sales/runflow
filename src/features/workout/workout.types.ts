export type WorkoutType = 'FREE_RUN' | 'INTERVAL';

export type WorkoutStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELED';

export type SegmentType = 'WARMUP' | 'RUN' | 'REST' | 'COOLDOWN';

export type TargetType = 'TIME' | 'DISTANCE';

export type Workout = {
  id: string;
  type: WorkoutType;
  status: WorkoutStatus;
  startedAt: string;
  endedAt: string | null;
  totalDistance: number;
  totalDuration: number;
  avgPace: number | null;
  routeSnapshotUri: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutSegment = {
  id: string;
  workoutId: string;
  type: SegmentType;
  orderIndex: number;
  repetition: number | null;
  targetType: TargetType;
  targetValue: number;
  actualDistance: number;
  actualDuration: number;
  avgPace: number | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutPoint = {
  id: string;
  workoutId: string;
  segmentId: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  timestamp: string;
  createdAt: string;
};
