import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { WorkoutRepository } from '@/features/workout/workout.repository';

import { BACKGROUND_LOCATION_TASK_NAME } from './location.constants';
import { normalizeLocationPoint } from './location.service';
import type { LocationPoint } from './location.types';

type BackgroundLocationTaskData = {
  locations?: Location.LocationObject[];
};

export type BackgroundLocationPointHandler = (
  points: LocationPoint[],
) => Promise<void> | void;

function isLocationPoint(point: LocationPoint | null): point is LocationPoint {
  return point !== null;
}

async function saveBackgroundLocationPoints(
  points: readonly LocationPoint[],
): Promise<void> {
  const activeWorkout = await WorkoutRepository.getActiveWorkout();

  if (!activeWorkout) {
    return;
  }

  await WorkoutRepository.addWorkoutPoints(
    activeWorkout.id,
    points.map((point) => ({
      ...point,
      segmentId: null,
    })),
  );
}

export function defineBackgroundLocationTask(
  onPoints: BackgroundLocationPointHandler = saveBackgroundLocationPoints,
): void {
  if (TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK_NAME)) {
    return;
  }

  TaskManager.defineTask<BackgroundLocationTaskData>(
    BACKGROUND_LOCATION_TASK_NAME,
    async ({ data, error }) => {
      if (error || !Array.isArray(data.locations)) {
        return;
      }

      const points = data.locations
        .map(normalizeLocationPoint)
        .filter(isLocationPoint);

      if (points.length > 0) {
        await onPoints(points);
      }
    },
  );
}

defineBackgroundLocationTask();

export { BACKGROUND_LOCATION_TASK_NAME };
