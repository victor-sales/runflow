import type { LocationObject, LocationSubscription } from 'expo-location';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const locationMock = vi.hoisted(() => ({
  Accuracy: {
    BestForNavigation: 6,
  },
  ActivityType: {
    Fitness: 3,
  },
  hasStartedLocationUpdatesAsync: vi.fn(),
  startLocationUpdatesAsync: vi.fn(),
  stopLocationUpdatesAsync: vi.fn(),
  watchPositionAsync: vi.fn(),
}));

vi.mock('expo-location', () => locationMock);

import {
  isValidLocationPoint,
  normalizeLocationPoint,
  startBackgroundLocationTracking,
  startLocationTracking,
  stopBackgroundLocationTracking,
  stopLocationTracking,
} from '../../../src/features/location/location.service';

type LocationObjectOverrides = Omit<Partial<LocationObject>, 'coords'> & {
  coords?: Partial<LocationObject['coords']>;
};

function createLocationObject(
  overrides: LocationObjectOverrides = {},
): LocationObject {
  const location: LocationObject = {
    coords: {
      latitude: -23.561684,
      longitude: -46.655981,
      accuracy: 10,
      altitude: 760,
      altitudeAccuracy: null,
      heading: null,
      speed: 3.2,
    },
    timestamp: Date.parse('2026-07-02T12:00:00.000Z'),
  };

  return {
    ...location,
    ...overrides,
    coords: {
      ...location.coords,
      ...overrides.coords,
    },
  };
}

describe('location service', () => {
  beforeEach(() => {
    locationMock.hasStartedLocationUpdatesAsync.mockReset();
    locationMock.startLocationUpdatesAsync.mockReset();
    locationMock.stopLocationUpdatesAsync.mockReset();
    locationMock.watchPositionAsync.mockReset();
  });

  it('normalizes an Expo location object to LocationPoint', () => {
    expect(normalizeLocationPoint(createLocationObject())).toEqual({
      latitude: -23.561684,
      longitude: -46.655981,
      accuracy: 10,
      altitude: 760,
      speed: 3.2,
      timestamp: '2026-07-02T12:00:00.000Z',
    });
  });

  it('filters points with accuracy greater than 30 meters', () => {
    expect(
      normalizeLocationPoint(
        createLocationObject({ coords: { accuracy: 31 } }),
      ),
    ).toBeNull();
  });

  it('accepts points with null accuracy', () => {
    expect(
      normalizeLocationPoint(
        createLocationObject({ coords: { accuracy: null } }),
      ),
    ).toMatchObject({
      accuracy: null,
    });
  });

  it('filters invalid latitude, longitude, and timestamp', () => {
    expect(
      normalizeLocationPoint(
        createLocationObject({ coords: { latitude: 91 } }),
      ),
    ).toBeNull();
    expect(
      normalizeLocationPoint(
        createLocationObject({ coords: { longitude: 181 } }),
      ),
    ).toBeNull();
    expect(
      normalizeLocationPoint(createLocationObject({ timestamp: Number.NaN })),
    ).toBeNull();
    expect(
      isValidLocationPoint({
        latitude: -23.561684,
        longitude: -46.655981,
        accuracy: null,
        altitude: null,
        speed: null,
        timestamp: 'invalid',
      }),
    ).toBe(false);
  });

  it('does not call the tracking callback for invalid points', async () => {
    const onPoint = vi.fn();
    const subscription: LocationSubscription = { remove: vi.fn() };

    locationMock.watchPositionAsync.mockImplementation(
      async (
        _options: unknown,
        callback: (location: LocationObject) => void,
      ): Promise<LocationSubscription> => {
        callback(createLocationObject({ coords: { accuracy: 31 } }));
        callback(createLocationObject({ coords: { accuracy: 30 } }));
        return subscription;
      },
    );

    const result = await startLocationTracking(onPoint);

    expect(result).toBe(subscription);
    expect(onPoint).toHaveBeenCalledTimes(1);
    expect(onPoint).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy: 30,
      }),
    );
  });

  it('reports gps signal even when the point is discarded', async () => {
    const onPoint = vi.fn();
    const onSignal = vi.fn();
    const subscription: LocationSubscription = { remove: vi.fn() };

    locationMock.watchPositionAsync.mockImplementation(
      async (
        _options: unknown,
        callback: (location: LocationObject) => void,
      ): Promise<LocationSubscription> => {
        callback(createLocationObject({ coords: { accuracy: 31 } }));
        return subscription;
      },
    );

    await startLocationTracking(onPoint, undefined, onSignal);

    expect(onPoint).not.toHaveBeenCalled();
    expect(onSignal).toHaveBeenCalledWith({
      message:
        'Sinal de GPS fraco. Desative o modo economia de bateria ou mantenha o app aberto para melhorar a precisao.',
      quality: 'invalid',
      status: 'lost',
    });
  });

  it('removes the active tracking subscription', () => {
    const subscription: LocationSubscription = { remove: vi.fn() };

    stopLocationTracking(subscription);

    expect(subscription.remove).toHaveBeenCalledTimes(1);
  });

  it('starts background tracking when it is not already running', async () => {
    locationMock.hasStartedLocationUpdatesAsync.mockResolvedValue(false);
    locationMock.startLocationUpdatesAsync.mockResolvedValue(undefined);

    await expect(startBackgroundLocationTracking()).resolves.toBe(true);

    expect(locationMock.startLocationUpdatesAsync).toHaveBeenCalledWith(
      'runflow-background-location',
      expect.objectContaining({
        accuracy: locationMock.Accuracy.BestForNavigation,
        distanceInterval: 5,
        foregroundService: expect.objectContaining({
          notificationTitle: 'RunFlow em treino',
        }),
        timeInterval: 1000,
      }),
    );
  });

  it('stops background tracking when it is running', async () => {
    locationMock.hasStartedLocationUpdatesAsync.mockResolvedValue(true);
    locationMock.stopLocationUpdatesAsync.mockResolvedValue(undefined);

    await stopBackgroundLocationTracking();

    expect(locationMock.stopLocationUpdatesAsync).toHaveBeenCalledWith(
      'runflow-background-location',
    );
  });
});
