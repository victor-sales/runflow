import { beforeEach, describe, expect, it, vi } from 'vitest';

const locationMock = vi.hoisted(() => ({
  requestForegroundPermissionsAsync: vi.fn(),
}));

vi.mock('expo-location', () => locationMock);

import { requestForegroundLocationPermission } from '../../../src/features/location/location-permissions';

describe('location permissions', () => {
  beforeEach(() => {
    locationMock.requestForegroundPermissionsAsync.mockReset();
  });

  it('returns true when foreground location permission is granted', async () => {
    locationMock.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true });

    await expect(requestForegroundLocationPermission()).resolves.toBe(true);
  });

  it('returns false when foreground location permission is denied', async () => {
    locationMock.requestForegroundPermissionsAsync.mockResolvedValue({ granted: false });

    await expect(requestForegroundLocationPermission()).resolves.toBe(false);
  });
});
