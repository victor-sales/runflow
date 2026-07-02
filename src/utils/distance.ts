export type DistancePoint = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

const EARTH_RADIUS_METERS = 6371000;
const MAX_ACCEPTED_ACCURACY_METERS = 30;

const degreesToRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const isFiniteNumber = (value: number): boolean => Number.isFinite(value);

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

export const calculateTotalDistance = (
  points: readonly DistancePoint[],
): number => {
  const validPoints = points.filter(isValidDistancePoint);

  return validPoints.reduce((totalDistance, point, index) => {
    if (index === 0) {
      return totalDistance;
    }

    return (
      totalDistance +
      calculateDistanceBetweenPoints(validPoints[index - 1], point)
    );
  }, 0);
};
