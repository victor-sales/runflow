const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;

const padTwoDigits = (value: number): string =>
  value.toString().padStart(2, '0');

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor(
    (totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
  );
  const remainingSeconds = totalSeconds % SECONDS_PER_MINUTE;

  if (hours > 0) {
    return `${hours}:${padTwoDigits(minutes)}:${padTwoDigits(remainingSeconds)}`;
  }

  return `${padTwoDigits(minutes)}:${padTwoDigits(remainingSeconds)}`;
};
