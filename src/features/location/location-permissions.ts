import * as Location from 'expo-location';

export async function requestForegroundLocationPermission(): Promise<boolean> {
  const permission = await Location.requestForegroundPermissionsAsync();

  return permission.granted;
}

export async function requestBackgroundLocationPermission(): Promise<boolean> {
  const foregroundPermission = await Location.getForegroundPermissionsAsync();

  if (!foregroundPermission.granted) {
    return false;
  }

  const permission = await Location.requestBackgroundPermissionsAsync();

  return permission.granted;
}
