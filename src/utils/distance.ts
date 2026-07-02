export type DistancePoint = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp?: string | number | Date;
};

const EARTH_RADIUS_METERS = 6371000;
const MAX_ACCEPTED_ACCURACY_METERS = 30;
const MAX_REALISTIC_RUNNING_SPEED_METERS_PER_SECOND = 12;
const MAX_SEGMENT_DISTANCE_WITHOUT_TIMESTAMP_METERS = 1000;

const degreesToRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const isFiniteNumber = (value: number): boolean => Number.isFinite(value);

const getTimestampSeconds = (
  timestamp: string | number | Date | undefined,
): number | null => {
  if (timestamp === undefined) {
    return null;
  }

  const milliseconds =
    timestamp instanceof Date
      ? timestamp.getTime()
      : typeof timestamp === 'number'
        ? timestamp
        : Date.parse(timestamp);

  return Number.isFinite(milliseconds) ? milliseconds / 1000 : null;
};

export const isValidDistancePoint = (point: DistancePoint): boolean => {
  const hasValidLatitude =
    isFiniteNumber(point.latitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90;
  const hasValidLongitude =
    isFiniteNumber(point.longitude) &&
    point.longitude >= -180 &&
    point.longitude <= 180;
  const hasValidAccuracy =
    point.accuracy === undefined ||
    point.accuracy === null ||
    (isFiniteNumber(point.accuracy) &&
      point.accuracy <= MAX_ACCEPTED_ACCURACY_METERS);

  return hasValidLatitude && hasValidLongitude && hasValidAccuracy;
};

export const calculateDistanceBetweenPoints = (
  start: DistancePoint,
  end: DistancePoint,
): number => {
  if (!isValidDistancePoint(start) || !isValidDistancePoint(end)) {
    return 0;
  }

  const startLatitude = degreesToRadians(start.latitude);
  const endLatitude = degreesToRadians(end.latitude);
  const latitudeDelta = degreesToRadians(end.latitude - start.latitude);
  const longitudeDelta = degreesToRadians(end.longitude - start.longitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  const angularDistance =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  const distanceMeters = EARTH_RADIUS_METERS * angularDistance;

  return Number.isFinite(distanceMeters) ? distanceMeters : 0;
};

const isRealisticDistanceSegment = (
  start: DistancePoint,
  end: DistancePoint,
): boolean => {
  const distanceMeters = calculateDistanceBetweenPoints(start, end);

  if (distanceMeters === 0) {
    return true;
  }

  const startTimestampSeconds = getTimestampSeconds(start.timestamp);
  const endTimestampSeconds = getTimestampSeconds(end.timestamp);

  if (startTimestampSeconds === null || endTimestampSeconds === null) {
    return distanceMeters <= MAX_SEGMENT_DISTANCE_WITHOUT_TIMESTAMP_METERS;
  }

  const durationSeconds = endTimestampSeconds - startTimestampSeconds;

  if (durationSeconds <= 0) {
    return false;
  }

  return (
    distanceMeters / durationSeconds <=
    MAX_REALISTIC_RUNNING_SPEED_METERS_PER_SECOND
  );
};

export const calculateTotalDistance = (
  points: readonly DistancePoint[],
): number => {
  const validPoints = points.filter(isValidDistancePoint);

  return validPoints.reduce((totalDistance, point, index) => {
    if (index === 0) {
      return totalDistance;
    }

    const previousPoint = validPoints[index - 1];

    if (!isRealisticDistanceSegment(previousPoint, point)) {
      return totalDistance;
    }

    return totalDistance + calculateDistanceBetweenPoints(previousPoint, point);
  }, 0);
};
