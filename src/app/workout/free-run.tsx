import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Alert, AppState, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/MetricCard';
import { Screen } from '@/components/ui/Screen';
import {
  WorkoutMap,
  type WorkoutMapHandle,
} from '@/components/workout/WorkoutMap';
import { requestForegroundLocationPermission } from '@/features/location/location-permissions';
import type { GpsSignalStatus } from '@/features/location/location-quality';
import type { LocationPoint } from '@/features/location/location.types';
import {
  startLocationTracking,
  stopLocationTracking,
  type LocationTrackingSubscription,
} from '@/features/location/location.service';
import { saveRouteSnapshot } from '@/features/workout/route-snapshot.service';
import { WorkoutRepository } from '@/features/workout/workout.repository';
import type { Workout, WorkoutPoint } from '@/features/workout/workout.types';
import {
  useActiveWorkoutStore,
  type ActiveWorkoutStatus,
} from '@/store/active-workout.store';
import { formatDistance, formatDuration, formatPace } from '@/utils/format';

export default function FreeRunScreen() {
  const [isSaving, setIsSaving] = useState(false);
  const [isTrackingStarting, setIsTrackingStarting] = useState(false);
  const isTrackingStartingRef = useRef(false);
  const mapRef = useRef<WorkoutMapHandle | null>(null);
  const pendingPointWritesRef = useRef<Set<Promise<void>>>(new Set());
  const subscriptionRef = useRef<LocationTrackingSubscription | null>(null);
  const trackingRequestIdRef = useRef(0);
  const {
    averagePace,
    currentPace,
    distanceMeters,
    elapsedSeconds,
    endedAt,
    errorMessage,
    gpsSignal,
    gpsSignalMessage,
    status,
    cancelWorkout,
    finishWorkout,
    pauseWorkout,
    points,
    resetWorkout,
    restoreActiveWorkout,
    resumeWorkout,
    setErrorMessage,
    setGpsSignal,
    startWorkout,
  } = useActiveWorkoutStore();

  const trackPointWrite = useCallback(
    (promise: Promise<unknown>) => {
      const trackedPromise = promise
        .catch((error: unknown) => {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Falha ao salvar ponto GPS.',
          );
        })
        .then(() => undefined);

      pendingPointWritesRef.current.add(trackedPromise);
      void trackedPromise.finally(() => {
        pendingPointWritesRef.current.delete(trackedPromise);
      });
    },
    [setErrorMessage],
  );

  const waitForPendingPointWrites = useCallback(async () => {
    await Promise.allSettled([...pendingPointWritesRef.current]);
  }, []);

  const captureRouteSnapshot = useCallback(
    async (workoutId: string): Promise<string | null> => {
      try {
        const snapshotUri = (await mapRef.current?.takeSnapshot()) ?? null;

        return saveRouteSnapshot(workoutId, snapshotUri);
      } catch {
        return null;
      }
    },
    [],
  );

  const handleLocationPoint = useCallback(
    (point: LocationPoint) => {
      const state = useActiveWorkoutStore.getState();

      state.addPoint(point);

      if (state.status !== 'ACTIVE' || !state.workoutId) {
        return;
      }

      trackPointWrite(
        WorkoutRepository.addWorkoutPoint({
          ...point,
          segmentId: null,
          workoutId: state.workoutId,
        }),
      );
    },
    [trackPointWrite],
  );

  const stopForegroundTracking = useCallback(() => {
    trackingRequestIdRef.current += 1;
    stopLocationTracking(subscriptionRef.current);
    subscriptionRef.current = null;
  }, []);

  const stopTracking = useCallback(() => {
    stopForegroundTracking();
  }, [stopForegroundTracking]);

  const startTracking = useCallback(async (): Promise<boolean> => {
    if (isTrackingStartingRef.current) {
      return false;
    }

    isTrackingStartingRef.current = true;
    setIsTrackingStarting(true);
    const requestId = trackingRequestIdRef.current;

    try {
      if (subscriptionRef.current) {
        return true;
      }

      const subscription = await startLocationTracking(
        handleLocationPoint,
        setErrorMessage,
        (signal) => setGpsSignal(signal.status, signal.message),
      );

      if (requestId !== trackingRequestIdRef.current) {
        stopLocationTracking(subscription);
        return false;
      }

      subscriptionRef.current = subscription;

      return subscription !== null;
    } finally {
      isTrackingStartingRef.current = false;
      setIsTrackingStarting(false);
    }
  }, [handleLocationPoint, setErrorMessage, setGpsSignal]);

  const restorePersistedWorkout = useCallback(
    async (workout: Workout) => {
      const persistedPoints = await WorkoutRepository.getWorkoutPoints(
        workout.id,
      );

      restoreActiveWorkout({
        accumulatedElapsedSeconds: workout.totalDuration,
        activeStartedAt: workout.status === 'ACTIVE' ? workout.updatedAt : null,
        endedAt: workout.endedAt,
        points: persistedPoints.map(workoutPointToLocationPoint),
        startedAt: workout.startedAt,
        status: workout.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
        workoutId: workout.id,
      });
    },
    [restoreActiveWorkout],
  );

  const syncOpenWorkout = useCallback(async () => {
    const openWorkout = await WorkoutRepository.getOpenWorkout('FREE_RUN');

    if (!openWorkout) {
      return;
    }

    await restorePersistedWorkout(openWorkout);

    if (openWorkout.status === 'ACTIVE') {
      void startTracking();
    }
  }, [restorePersistedWorkout, startTracking]);

  const handleStart = async () => {
    if (isTrackingStartingRef.current || subscriptionRef.current) {
      return;
    }

    setErrorMessage(null);

    const hasForegroundPermission = await requestForegroundLocationPermission();

    if (!hasForegroundPermission) {
      setErrorMessage('Permissao de localizacao negada.');
      return;
    }

    const startedAtValue = new Date().toISOString();
    const workout = await WorkoutRepository.createWorkout({
      startedAt: startedAtValue,
      status: 'ACTIVE',
      type: 'FREE_RUN',
    });

    startWorkout(startedAtValue, workout.id);

    const started = await startTracking();

    if (!started) {
      await WorkoutRepository.cancelWorkout(workout.id);
      cancelWorkout();
    }
  };

  const handlePause = async () => {
    const state = useActiveWorkoutStore.getState();

    if (!state.workoutId) {
      return;
    }

    const pausedAt = new Date().toISOString();

    await stopTracking();
    await waitForPendingPointWrites();
    pauseWorkout(pausedAt);

    const pausedState = useActiveWorkoutStore.getState();

    await WorkoutRepository.updateWorkout(state.workoutId, {
      avgPace: pausedState.averagePace,
      status: 'PAUSED',
      totalDistance: pausedState.distanceMeters,
      totalDuration: pausedState.elapsedSeconds,
    });
  };

  const handleResume = async () => {
    const state = useActiveWorkoutStore.getState();

    if (
      isTrackingStartingRef.current ||
      subscriptionRef.current ||
      !state.workoutId
    ) {
      return;
    }

    setErrorMessage(null);

    const resumedAt = new Date().toISOString();
    const started = await startTracking();

    if (started) {
      resumeWorkout(resumedAt);
      const resumedState = useActiveWorkoutStore.getState();

      await WorkoutRepository.updateWorkout(state.workoutId, {
        avgPace: resumedState.averagePace,
        status: 'ACTIVE',
        totalDistance: resumedState.distanceMeters,
        totalDuration: resumedState.elapsedSeconds,
      });
    }
  };

  const handleCancel = async () => {
    const state = useActiveWorkoutStore.getState();

    await stopTracking();

    if (state.workoutId) {
      await WorkoutRepository.cancelWorkout(state.workoutId);
    }

    cancelWorkout();
  };

  const handleFinish = async () => {
    const state = useActiveWorkoutStore.getState();

    if (!state.startedAt || !state.workoutId || isSaving) {
      return;
    }

    setIsSaving(true);
    const finishedAt = new Date().toISOString();

    try {
      await stopTracking();
      await waitForPendingPointWrites();

      finishWorkout(finishedAt);

      const finishedState = useActiveWorkoutStore.getState();
      const routeSnapshotUri = await captureRouteSnapshot(state.workoutId);

      await WorkoutRepository.finishWorkout(state.workoutId, {
        avgPace: finishedState.averagePace,
        endedAt: finishedAt,
        routeSnapshotUri,
        totalDistance: finishedState.distanceMeters,
        totalDuration: finishedState.elapsedSeconds,
      });
      router.replace({
        params: { id: state.workoutId },
        pathname: '/workout/summary/[id]',
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao salvar treino.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    void syncOpenWorkout();
  }, [syncOpenWorkout]);

  useEffect(() => {
    if (status !== 'ACTIVE') {
      return;
    }

    const intervalId = setInterval(() => {
      useActiveWorkoutStore.getState().refreshElapsedSeconds();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [status]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        useActiveWorkoutStore.getState().refreshElapsedSeconds();
        void syncOpenWorkout();
      }
    });

    return () => subscription.remove();
  }, [syncOpenWorkout]);

  useEffect(
    () => () => {
      stopForegroundTracking();
    },
    [stopForegroundTracking],
  );

  const canStart = status === 'IDLE' || status === 'CANCELED';
  const canFinish = status === 'ACTIVE' || status === 'PAUSED';

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Corrida livre</AppText>
        <AppText color="secondary">{getStatusLabel(status, endedAt)}</AppText>
        {status === 'ACTIVE' ? (
          <AppText color="secondary" variant="caption">
            GPS: {getGpsSignalLabel(gpsSignal)}
          </AppText>
        ) : null}
      </View>

      <View style={styles.metrics}>
        <MetricCard label="Tempo" value={formatDuration(elapsedSeconds)} />
        <MetricCard label="Distancia" value={formatDistance(distanceMeters)} />
        <MetricCard label="Pace atual" value={formatPace(currentPace)} />
        <MetricCard label="Pace medio" value={formatPace(averagePace)} />
      </View>

      <WorkoutMap points={points} ref={mapRef} />

      {errorMessage ? (
        <AppText color="secondary" variant="caption">
          {errorMessage}
        </AppText>
      ) : null}

      {gpsSignal !== 'good' && gpsSignalMessage && status === 'ACTIVE' ? (
        <AppText color="secondary" variant="caption">
          {gpsSignalMessage}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        {canStart ? (
          <Button
            disabled={isTrackingStarting}
            fullWidth
            label={isTrackingStarting ? 'Iniciando...' : 'Iniciar treino'}
            onPress={handleStart}
          />
        ) : null}
        {status === 'ACTIVE' ? (
          <Button
            fullWidth
            label="Pausar"
            onPress={handlePause}
            variant="secondary"
          />
        ) : null}
        {status === 'PAUSED' ? (
          <Button
            disabled={isTrackingStarting}
            fullWidth
            label={isTrackingStarting ? 'Retomando...' : 'Retomar'}
            onPress={handleResume}
            variant="secondary"
          />
        ) : null}
        {canFinish ? (
          <Button
            disabled={isSaving}
            fullWidth
            label={isSaving ? 'Salvando...' : 'Finalizar'}
            onPress={handleFinish}
          />
        ) : null}
        {canFinish ? (
          <Button
            fullWidth
            label="Cancelar"
            onPress={() =>
              Alert.alert('Cancelar treino?', 'Os pontos serao descartados.', [
                { style: 'cancel', text: 'Voltar' },
                {
                  onPress: handleCancel,
                  style: 'destructive',
                  text: 'Cancelar',
                },
              ])
            }
            variant="ghost"
          />
        ) : null}
        {status === 'COMPLETED' ? (
          <Button
            fullWidth
            label="Novo treino"
            onPress={resetWorkout}
            variant="secondary"
          />
        ) : null}
      </View>
    </Screen>
  );
}

function workoutPointToLocationPoint(point: WorkoutPoint): LocationPoint {
  return {
    accuracy: point.accuracy,
    altitude: point.altitude,
    latitude: point.latitude,
    longitude: point.longitude,
    speed: point.speed,
    timestamp: point.timestamp,
  };
}

function getStatusLabel(
  status: ActiveWorkoutStatus,
  endedAt: string | null,
): string {
  if (status === 'ACTIVE') {
    return 'Capturando GPS em foreground.';
  }

  if (status === 'PAUSED') {
    return 'Treino pausado.';
  }

  if (status === 'COMPLETED') {
    return endedAt ? 'Treino finalizado e salvo.' : 'Treino finalizado.';
  }

  if (status === 'CANCELED') {
    return 'Treino cancelado.';
  }

  return 'Inicie para capturar GPS e acompanhar metricas.';
}

function getGpsSignalLabel(signal: GpsSignalStatus): string {
  if (signal === 'good') {
    return 'bom';
  }

  if (signal === 'weak') {
    return 'fraco';
  }

  return 'sem sinal confiavel';
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  header: {
    gap: 10,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
