import {
  calculateTotalDistance,
  isValidDistancePoint,
  type DistancePoint,
} from './distance';

export type PacePoint = DistancePoint & {
  timestamp: string | number | Date;
};

const MIN_CURRENT_PACE_WINDOW_SECONDS = 10;
const MAX_CURRENT_PACE_WINDOW_SECONDS = 20;

const getTimestampSeconds = (
  timestamp: string | number | Date,
): number | null => {
  const milliseconds =
    timestamp instanceof Date
      ? timestamp.getTime()
      : typeof timestamp === 'number'
        ? timestamp
        : Date.parse(timestamp);

  if (!Number.isFinite(milliseconds)) {
    return null;
  }

  return milliseconds / 1000;
};

const clampCurrentPaceWindow = (windowSeconds: number): number => {
  if (!Number.isFinite(windowSeconds)) {
    return MAX_CURRENT_PACE_WINDOW_SECONDS;
  }

  return Math.min(
    MAX_CURRENT_PACE_WINDOW_SECONDS,
    Math.max(MIN_CURRENT_PACE_WINDOW_SECONDS, windowSeconds),
  );
};

export const calculateAvgPace = (
  durationSeconds: number,
  distanceMeters: number,
): number | null => {
  if (
    !Number.isFinite(durationSeconds) ||
    !Number.isFinite(distanceMeters) ||
    durationSeconds <= 0 ||
    distanceMeters <= 0
  ) {
    return null;
  }

  const distanceKilometers = distanceMeters / 1000;
  const paceSecondsPerKilometer = durationSeconds / distanceKilometers;

  return Number.isFinite(paceSecondsPerKilometer)
    ? Math.round(paceSecondsPerKilometer)
    : null;
};

export const calculateCurrentPace = (
  points: readonly PacePoint[],
  windowSeconds = MAX_CURRENT_PACE_WINDOW_SECONDS,
): number | null => {
  const validPoints = points
    .map((point) => ({
      point,
      timestampSeconds: getTimestampSeconds(point.timestamp),
    }))
    .filter(
      (
        entry,
      ): entry is {
        point: PacePoint;
        timestampSeconds: number;
      } => entry.timestampSeconds !== null && isValidDistancePoint(entry.point),
    );

  if (validPoints.length < 2) {
    return null;
  }

  const latestTimestampSeconds =
    validPoints[validPoints.length - 1].timestampSeconds;
  const windowStartSeconds =
    latestTimestampSeconds - clampCurrentPaceWindow(windowSeconds);
  const windowPoints = validPoints
    .filter((entry) => entry.timestampSeconds >= windowStartSeconds)
    .map((entry) => entry.point);

  if (windowPoints.length < 2) {
    return null;
  }

  const firstTimestampSeconds = getTimestampSeconds(windowPoints[0].timestamp);
  const lastTimestampSeconds = getTimestampSeconds(
    windowPoints[windowPoints.length - 1].timestamp,
  );

  if (firstTimestampSeconds === null || lastTimestampSeconds === null) {
    return null;
  }

  return calculateAvgPace(
    lastTimestampSeconds - firstTimestampSeconds,
    calculateTotalDistance(windowPoints),
  );
};
