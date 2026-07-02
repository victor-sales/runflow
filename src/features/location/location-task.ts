import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { normalizeLocationPoint } from './location.service';
import type { LocationPoint } from './location.types';

export const BACKGROUND_LOCATION_TASK_NAME = 'runflow-background-location';

type BackgroundLocationTaskData = {
  locations?: Location.LocationObject[];
};

export type BackgroundLocationPointHandler = (points: LocationPoint[]) => void;

function isLocationPoint(point: LocationPoint | null): point is LocationPoint {
  return point !== null;
}

export function defineBackgroundLocationTask(
  onPoints?: BackgroundLocationPointHandler,
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
        onPoints?.(points);
      }
    },
  );
}
