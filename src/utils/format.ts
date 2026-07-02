import { formatDuration } from './time';

export { formatDuration };

export const formatPace = (paceSecondsPerKilometer: number | null): string => {
  if (
    paceSecondsPerKilometer === null ||
    !Number.isFinite(paceSecondsPerKilometer) ||
    paceSecondsPerKilometer <= 0
  ) {
    return '--:--/km';
  }

  const totalSeconds = Math.round(paceSecondsPerKilometer);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
};

export const formatDistance = (distanceMeters: number): string => {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    return '0 m';
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(2)} km`;
};
