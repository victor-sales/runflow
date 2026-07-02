import { describe, expect, it } from 'vitest';

import { formatDistance, formatDuration, formatPace } from '../../src/utils/format';

describe('format utils', () => {
  it('formats pace', () => {
    expect(formatPace(300)).toBe('5:00/km');
    expect(formatPace(null)).toBe('--:--/km');
  });

  it('formats duration', () => {
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('formats distance', () => {
    expect(formatDistance(250)).toBe('250 m');
    expect(formatDistance(1500)).toBe('1.50 km');
    expect(formatDistance(0)).toBe('0 m');
  });
});
