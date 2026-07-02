import { describe, expect, it } from 'vitest';

import {
  getLocationSignalQuality,
  getLocationSignalReason,
  isWeakGpsSignal,
} from '../../../src/features/location/location-quality';
import type { LocationPoint } from '../../../src/features/location/location.types';

function createPoint(overrides: Partial<LocationPoint> = {}): LocationPoint {
  return {
    accuracy: 10,
    altitude: null,
    latitude: -23.561684,
    longitude: -46.655981,
    speed: 3,
    timestamp: '2026-07-02T12:00:00.000Z',
    ...overrides,
  };
}

describe('location quality', () => {
  it('returns good for accurate points', () => {
    expect(getLocationSignalQuality(createPoint({ accuracy: 15 }))).toBe(
      'good',
    );
  });

  it('returns weak for medium accuracy points', () => {
    expect(getLocationSignalQuality(createPoint({ accuracy: 16 }))).toBe(
      'weak',
    );
    expect(isWeakGpsSignal(createPoint({ accuracy: 30 }))).toBe(true);
  });

  it('returns invalid for points above the accepted accuracy', () => {
    expect(getLocationSignalQuality(createPoint({ accuracy: 31 }))).toBe(
      'invalid',
    );
  });

  it('returns weak for null accuracy', () => {
    expect(getLocationSignalQuality(createPoint({ accuracy: null }))).toBe(
      'weak',
    );
  });

  it('returns invalid for invalid coordinates or timestamp', () => {
    expect(getLocationSignalQuality(createPoint({ latitude: 91 }))).toBe(
      'invalid',
    );
    expect(getLocationSignalQuality(createPoint({ longitude: 181 }))).toBe(
      'invalid',
    );
    expect(
      getLocationSignalQuality(createPoint({ timestamp: 'invalid' })),
    ).toBe('invalid');
  });

  it('returns weak for long gaps between points', () => {
    expect(
      getLocationSignalQuality(
        createPoint({ timestamp: '2026-07-02T12:00:11.000Z' }),
        createPoint(),
      ),
    ).toBe('weak');
  });

  it('returns weak for unrealistic running speed between points', () => {
    expect(
      getLocationSignalQuality(
        createPoint({
          longitude: -46.655,
          timestamp: '2026-07-02T12:00:01.000Z',
        }),
        createPoint(),
      ),
    ).toBe('weak');
  });

  it('returns a reason for weak gps signal', () => {
    expect(getLocationSignalReason(createPoint({ accuracy: null }))).toBe(
      'Sinal de GPS fraco. Desative o modo economia de bateria ou mantenha o app aberto para melhorar a precisao.',
    );
  });
});
