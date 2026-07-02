import { calculateDistanceBetweenPoints } from '@/utils/distance';

import type { LocationPoint } from './location.types';

export type LocationSignalQuality = 'good' | 'weak' | 'invalid';
export type GpsSignalStatus = 'good' | 'weak' | 'lost';

const MAX_GOOD_ACCURACY_METERS = 15;
const MAX_ACCEPTED_ACCURACY_METERS = 30;
const MAX_SECONDS_BETWEEN_POINTS = 10;
const MAX_REALISTIC_RUNNING_SPEED_METERS_PER_SECOND = 8;
const WEAK_GPS_SIGNAL_MESSAGE =
  'Sinal de GPS fraco. Desative o modo economia de bateria ou mantenha o app aberto para melhorar a precisao.';

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function getTimestampMilliseconds(timestamp: string): number | null {
  const value = Date.parse(timestamp);

  return Number.isFinite(value) ? value : null;
}

function hasValidBaseFields(point: LocationPoint): boolean {
  return (
    isFiniteNumber(point.latitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    isFiniteNumber(point.longitude) &&
    point.longitude >= -180 &&
    point.longitude <= 180 &&
    getTimestampMilliseconds(point.timestamp) !== null &&
    (point.accuracy === null ||
      (isFiniteNumber(point.accuracy) && point.accuracy >= 0)) &&
    (point.altitude === null || isFiniteNumber(point.altitude)) &&
    (point.speed === null || (isFiniteNumber(point.speed) && point.speed >= 0))
  );
}

function getElapsedSeconds(
  point: LocationPoint,
  previousPoint: LocationPoint,
): number | null {
  const timestamp = getTimestampMilliseconds(point.timestamp);
  const previousTimestamp = getTimestampMilliseconds(previousPoint.timestamp);

  if (timestamp === null || previousTimestamp === null) {
    return null;
  }

  return (timestamp - previousTimestamp) / 1000;
}

function hasWeakMovementSignal(
  point: LocationPoint,
  previousPoint: LocationPoint | null,
): boolean {
  if (!previousPoint) {
    return false;
  }

  const elapsedSeconds = getElapsedSeconds(point, previousPoint);

  if (elapsedSeconds === null || elapsedSeconds <= 0) {
    return true;
  }

  if (elapsedSeconds > MAX_SECONDS_BETWEEN_POINTS) {
    return true;
  }

  const distanceMeters = calculateDistanceBetweenPoints(previousPoint, point);

  return (
    distanceMeters / elapsedSeconds >
    MAX_REALISTIC_RUNNING_SPEED_METERS_PER_SECOND
  );
}

export function getLocationSignalQuality(
  point: LocationPoint,
  previousPoint: LocationPoint | null = null,
): LocationSignalQuality {
  if (!hasValidBaseFields(point)) {
    return 'invalid';
  }

  if (
    point.accuracy !== null &&
    point.accuracy > MAX_ACCEPTED_ACCURACY_METERS
  ) {
    return 'invalid';
  }

  if (
    point.accuracy === null ||
    point.accuracy > MAX_GOOD_ACCURACY_METERS ||
    hasWeakMovementSignal(point, previousPoint)
  ) {
    return 'weak';
  }

  return 'good';
}

export function getLocationSignalReason(
  point: LocationPoint,
  previousPoint: LocationPoint | null = null,
): string | null {
  const quality = getLocationSignalQuality(point, previousPoint);

  if (quality === 'good') {
    return null;
  }

  if (quality === 'invalid' && !hasValidBaseFields(point)) {
    return 'Ponto GPS invalido.';
  }

  return WEAK_GPS_SIGNAL_MESSAGE;
}

export function isWeakGpsSignal(
  point: LocationPoint,
  previousPoint: LocationPoint | null = null,
): boolean {
  return getLocationSignalQuality(point, previousPoint) === 'weak';
}
