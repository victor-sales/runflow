import * as Location from 'expo-location';

import { BACKGROUND_LOCATION_TASK_NAME } from './location.constants';
import {
  getLocationSignalQuality,
  getLocationSignalReason,
  isAcceptedLocationPoint,
  type GpsSignalStatus,
  type LocationSignalQuality,
} from './location-quality';
import type { LocationPoint } from './location.types';

export type LocationPointHandler = (point: LocationPoint) => void;
export type LocationTrackingErrorHandler = (message: string) => void;
export type LocationTrackingSubscription = Location.LocationSubscription;
export type LocationSignal = {
  message: string | null;
  quality: LocationSignalQuality;
  status: GpsSignalStatus;
};
export type LocationSignalHandler = (signal: LocationSignal) => void;

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function normalizeNullableNumber(value: number | null): number | null {
  return value !== null && isFiniteNumber(value) ? value : null;
}

function getLocationSignal(
  point: LocationPoint,
  previousPoint: LocationPoint | null,
): LocationSignal {
  const quality = getLocationSignalQuality(point, previousPoint);

  return {
    message: getLocationSignalReason(point, previousPoint),
    quality,
    status: quality === 'invalid' ? 'lost' : quality,
  };
}

function locationObjectToPoint(
  location: Location.LocationObject,
): LocationPoint | null {
  if (!Number.isFinite(location.timestamp)) {
    return null;
  }

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: normalizeNullableNumber(location.coords.accuracy),
    altitude: normalizeNullableNumber(location.coords.altitude),
    speed: normalizeNullableNumber(location.coords.speed),
    timestamp: new Date(location.timestamp).toISOString(),
  };
}

export function isValidLocationPoint(point: LocationPoint): boolean {
  return isAcceptedLocationPoint(point);
}

export function normalizeLocationPoint(
  location: Location.LocationObject,
): LocationPoint | null {
  const point = locationObjectToPoint(location);

  return point && isValidLocationPoint(point) ? point : null;
}

export async function startLocationTracking(
  onPoint: LocationPointHandler,
  onError?: LocationTrackingErrorHandler,
  onSignalChange?: LocationSignalHandler,
): Promise<LocationTrackingSubscription | null> {
  let previousPoint: LocationPoint | null = null;

  try {
    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 1000,
      },
      (location) => {
        const point = locationObjectToPoint(location);

        if (!point) {
          onSignalChange?.({
            message: 'Ponto GPS invalido.',
            quality: 'invalid',
            status: 'lost',
          });
          return;
        }

        onSignalChange?.(getLocationSignal(point, previousPoint));

        if (isValidLocationPoint(point)) {
          onPoint(point);
          previousPoint = point;
        }
      },
      onError,
    );
  } catch (error) {
    onError?.(
      error instanceof Error
        ? error.message
        : 'Unable to start location tracking',
    );
    return null;
  }
}

export async function startBackgroundLocationTracking(
  onError?: LocationTrackingErrorHandler,
): Promise<boolean> {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK_NAME,
    );

    if (hasStarted) {
      return true;
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      activityType: Location.ActivityType.Fitness,
      distanceInterval: 5,
      foregroundService: {
        notificationBody: 'Registrando sua corrida em segundo plano.',
        notificationColor: '#0F172A',
        notificationTitle: 'RunFlow em treino',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      timeInterval: 1000,
    });

    return true;
  } catch (error) {
    onError?.(
      error instanceof Error
        ? error.message
        : 'Unable to start background location tracking',
    );
    return false;
  }
}

export async function stopBackgroundLocationTracking(
  onError?: LocationTrackingErrorHandler,
): Promise<void> {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK_NAME,
    );

    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME);
    }
  } catch (error) {
    onError?.(
      error instanceof Error
        ? error.message
        : 'Unable to stop background location tracking',
    );
  }
}

export function stopLocationTracking(
  subscription: LocationTrackingSubscription | null | undefined,
): void {
  subscription?.remove();
}
