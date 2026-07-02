import { describe, expect, it } from 'vitest';

import {
  calculateDistanceBetweenPoints,
  calculateTotalDistance,
} from '../../src/utils/distance';

describe('distance utils', () => {
  it('calculates distance between two points using Haversine', () => {
    const distance = calculateDistanceBetweenPoints(
      { latitude: -23.561684, longitude: -46.655981 },
      { latitude: -23.560152, longitude: -46.650592 },
    );

    expect(distance).toBeGreaterThan(570);
    expect(distance).toBeLessThan(580);
  });

  it('returns zero for invalid or inaccurate points', () => {
    expect(
      calculateDistanceBetweenPoints(
        { latitude: -23.561684, longitude: -46.655981 },
        { latitude: -23.560152, longitude: -46.650592, accuracy: 31 },
      ),
    ).toBe(0);
  });

  it('calculates total distance using valid consecutive points', () => {
    const distance = calculateTotalDistance([
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 0.001 },
      { latitude: 0, longitude: 0.002 },
    ]);

    expect(distance).toBeGreaterThan(222);
    expect(distance).toBeLessThan(223);
  });
});
