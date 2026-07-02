import { beforeEach, describe, expect, it, vi } from 'vitest';

const locationMock = vi.hoisted(() => ({
  getForegroundPermissionsAsync: vi.fn(),
  requestBackgroundPermissionsAsync: vi.fn(),
  requestForegroundPermissionsAsync: vi.fn(),
}));

vi.mock('expo-location', () => locationMock);

import {
  requestBackgroundLocationPermission,
  requestForegroundLocationPermission,
} from '../../../src/features/location/location-permissions';

describe('location permissions', () => {
  beforeEach(() => {
    locationMock.getForegroundPermissionsAsync.mockReset();
    locationMock.requestBackgroundPermissionsAsync.mockReset();
    locationMock.requestForegroundPermissionsAsync.mockReset();
  });

  it('returns true when foreground location permission is granted', async () => {
    locationMock.requestForegroundPermissionsAsync.mockResolvedValue({
      granted: true,
    });

    await expect(requestForegroundLocationPermission()).resolves.toBe(true);
  });

  it('returns false when foreground location permission is denied', async () => {
    locationMock.requestForegroundPermissionsAsync.mockResolvedValue({
      granted: false,
    });

    await expect(requestForegroundLocationPermission()).resolves.toBe(false);
  });

  it('requests background location only after foreground is granted', async () => {
    locationMock.getForegroundPermissionsAsync.mockResolvedValue({
      granted: true,
    });
    locationMock.requestBackgroundPermissionsAsync.mockResolvedValue({
      granted: true,
    });

    await expect(requestBackgroundLocationPermission()).resolves.toBe(true);
  });

  it('does not request background location without foreground permission', async () => {
    locationMock.getForegroundPermissionsAsync.mockResolvedValue({
      granted: false,
    });

    await expect(requestBackgroundLocationPermission()).resolves.toBe(false);
    expect(locationMock.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
  });
});
