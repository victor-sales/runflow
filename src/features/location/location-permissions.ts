import * as Location from 'expo-location';

export async function requestForegroundLocationPermission(): Promise<boolean> {
  const permission = await Location.requestForegroundPermissionsAsync();

  return permission.granted;
}
