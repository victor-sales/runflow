import {
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { Image, StyleSheet, View } from 'react-native';
import MapView, { Polyline, type LatLng, type Region } from 'react-native-maps';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';

export type WorkoutMapPoint = {
  latitude: number;
  longitude: number;
};

export type WorkoutMapHandle = {
  takeSnapshot: () => Promise<string | null>;
};

type WorkoutMapProps = {
  points: readonly WorkoutMapPoint[];
  snapshotUri?: string | null;
};

const MIN_DELTA = 0.01;
const REGION_PADDING_FACTOR = 1.4;
const MAP_EDGE_PADDING = {
  bottom: 32,
  left: 32,
  right: 32,
  top: 32,
};

export const WorkoutMap = forwardRef<WorkoutMapHandle, WorkoutMapProps>(
  function WorkoutMap({ points, snapshotUri = null }, ref) {
    const mapRef = useRef<MapView | null>(null);
    const coordinates = useMemo(() => pointsToCoordinates(points), [points]);
    const initialRegion = useMemo(
      () => getInitialRegion(coordinates),
      [coordinates],
    );

    useImperativeHandle(
      ref,
      () => ({
        async takeSnapshot() {
          if (!mapRef.current || coordinates.length === 0) {
            return null;
          }

          return mapRef.current.takeSnapshot({
            format: 'png',
            result: 'file',
          });
        },
      }),
      [coordinates.length],
    );

    useEffect(() => {
      if (coordinates.length < 2) {
        return;
      }

      mapRef.current?.fitToCoordinates(coordinates, {
        animated: false,
        edgePadding: MAP_EDGE_PADDING,
      });
    }, [coordinates]);

    if (snapshotUri) {
      return (
        <Card>
          <AppText variant="subtitle">Percurso</AppText>
          <Image source={{ uri: snapshotUri }} style={styles.snapshot} />
        </Card>
      );
    }

    if (coordinates.length === 0 || !initialRegion) {
      return (
        <Card>
          <AppText variant="subtitle">Percurso</AppText>
          <View style={styles.empty}>
            <AppText color="secondary">
              Este treino nao possui pontos GPS.
            </AppText>
          </View>
        </Card>
      );
    }

    return (
      <Card>
        <AppText variant="subtitle">Percurso</AppText>
        <View style={styles.mapContainer}>
          <MapView
            initialRegion={initialRegion}
            ref={mapRef}
            style={styles.map}
          >
          <Polyline
            coordinates={coordinates}
            strokeColor="#2563eb"
            strokeWidth={4}
          />
          </MapView>
        </View>
      </Card>
    );
  },
);

function pointsToCoordinates(points: readonly WorkoutMapPoint[]): LatLng[] {
  return points
    .map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    }))
    .filter(
      (coordinate) =>
        Number.isFinite(coordinate.latitude) &&
        Number.isFinite(coordinate.longitude),
    );
}

function getInitialRegion(coordinates: LatLng[]): Region | null {
  const firstCoordinate = coordinates[0];

  if (!firstCoordinate) {
    return null;
  }

  if (coordinates.length === 1) {
    return {
      latitude: firstCoordinate.latitude,
      latitudeDelta: MIN_DELTA,
      longitude: firstCoordinate.longitude,
      longitudeDelta: MIN_DELTA,
    };
  }

  const bounds = coordinates.reduce(
    (currentBounds, coordinate) => ({
      maxLatitude: Math.max(currentBounds.maxLatitude, coordinate.latitude),
      maxLongitude: Math.max(currentBounds.maxLongitude, coordinate.longitude),
      minLatitude: Math.min(currentBounds.minLatitude, coordinate.latitude),
      minLongitude: Math.min(currentBounds.minLongitude, coordinate.longitude),
    }),
    {
      maxLatitude: firstCoordinate.latitude,
      maxLongitude: firstCoordinate.longitude,
      minLatitude: firstCoordinate.latitude,
      minLongitude: firstCoordinate.longitude,
    },
  );

  const latitudeSpan = bounds.maxLatitude - bounds.minLatitude;
  const longitudeSpan = bounds.maxLongitude - bounds.minLongitude;

  return {
    latitude: (bounds.maxLatitude + bounds.minLatitude) / 2,
    latitudeDelta: Math.max(latitudeSpan * REGION_PADDING_FACTOR, MIN_DELTA),
    longitude: (bounds.maxLongitude + bounds.minLongitude) / 2,
    longitudeDelta: Math.max(longitudeSpan * REGION_PADDING_FACTOR, MIN_DELTA),
  };
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 180,
    justifyContent: 'center',
  },
  map: {
    flex: 1,
  },
  mapContainer: {
    borderRadius: 8,
    height: 260,
    overflow: 'hidden',
  },
  snapshot: {
    borderRadius: 8,
    height: 260,
    width: '100%',
  },
});
