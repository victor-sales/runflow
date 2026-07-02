import * as Location from 'expo-location';

import {
  getLocationSignalQuality,
  getLocationSignalReason,
  type GpsSignalStatus,
  type LocationSignalQuality,
} from './location-quality';
import type { LocationPoint } from './location.types';

const MAX_LOCATION_ACCURACY_METERS = 30;

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

function isValidTimestamp(timestamp: string): boolean {
  return timestamp.length > 0 && Number.isFinite(Date.parse(timestamp));
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
  const hasValidCoordinates =
    isFiniteNumber(point.latitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    isFiniteNumber(point.longitude) &&
    point.longitude >= -180 &&
    point.longitude <= 180;

  const hasValidAccuracy =
    point.accuracy === null ||
    (isFiniteNumber(point.accuracy) &&
      point.accuracy >= 0 &&
      point.accuracy <= MAX_LOCATION_ACCURACY_METERS);

  const hasValidAltitude =
    point.altitude === null || isFiniteNumber(point.altitude);
  const hasValidSpeed =
    point.speed === null || (isFiniteNumber(point.speed) && point.speed >= 0);

  return (
    hasValidCoordinates &&
    hasValidAccuracy &&
    hasValidAltitude &&
    hasValidSpeed &&
    isValidTimestamp(point.timestamp)
  );
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

export function stopLocationTracking(
  subscription: LocationTrackingSubscription | null | undefined,
): void {
  subscription?.remove();
}
