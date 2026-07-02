import { describe, expect, it } from 'vitest';

import { calculateAvgPace, calculateCurrentPace } from '../../src/utils/pace';

describe('pace utils', () => {
  it('calculates average pace in seconds per kilometer', () => {
    expect(calculateAvgPace(1500, 5000)).toBe(300);
  });

  it('returns null when distance or duration cannot generate a valid pace', () => {
    expect(calculateAvgPace(1500, 0)).toBeNull();
    expect(calculateAvgPace(0, 5000)).toBeNull();
  });

  it('calculates current pace using a moving window', () => {
    const pace = calculateCurrentPace(
      [
        { latitude: 0, longitude: 0, timestamp: '2026-07-02T12:00:00.000Z' },
        {
          latitude: 0,
          longitude: 0.001,
          timestamp: '2026-07-02T12:00:10.000Z',
        },
        {
          latitude: 0,
          longitude: 0.002,
          timestamp: '2026-07-02T12:00:20.000Z',
        },
      ],
      20,
    );

    expect(pace).toBe(90);
  });

  it('does not calculate current pace from a single point', () => {
    expect(
      calculateCurrentPace([
        { latitude: 0, longitude: 0, timestamp: '2026-07-02T12:00:00.000Z' },
      ]),
    ).toBeNull();
  });

  it('does not calculate current pace before the minimum moving window duration', () => {
    expect(
      calculateCurrentPace(
        [
          {
            latitude: 0,
            longitude: 0,
            timestamp: '2026-07-02T12:00:00.000Z',
          },
          {
            latitude: 0,
            longitude: 0.001,
            timestamp: '2026-07-02T12:00:09.000Z',
          },
        ],
        20,
      ),
    ).toBeNull();
  });
});
