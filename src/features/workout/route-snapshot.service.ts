import { Directory, File, Paths } from 'expo-file-system';

const ROUTE_SNAPSHOT_DIRECTORY = 'route-snapshots';

export function saveRouteSnapshot(
  workoutId: string,
  snapshotUri: string | null,
): string | null {
  if (!snapshotUri) {
    return null;
  }

  const directory = new Directory(Paths.document, ROUTE_SNAPSHOT_DIRECTORY);
  directory.create({ idempotent: true, intermediates: true });

  const source = new File(snapshotUri);
  const destination = new File(directory, `${workoutId}.png`);

  if (destination.exists) {
    destination.delete();
  }

  source.copy(destination);

  return destination.uri;
}
