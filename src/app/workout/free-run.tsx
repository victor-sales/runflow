import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/MetricCard';
import { Screen } from '@/components/ui/Screen';
import { requestForegroundLocationPermission } from '@/features/location/location-permissions';
import {
  startLocationTracking,
  stopLocationTracking,
  type LocationTrackingSubscription,
} from '@/features/location/location.service';
import { WorkoutRepository } from '@/features/workout/workout.repository';
import { useActiveWorkoutStore } from '@/store/active-workout.store';
import { formatDistance, formatDuration, formatPace } from '@/utils/format';

export default function FreeRunScreen() {
  const [isSaving, setIsSaving] = useState(false);
  const subscriptionRef = useRef<LocationTrackingSubscription | null>(null);
  const {
    averagePace,
    currentPace,
    distanceMeters,
    elapsedSeconds,
    endedAt,
    errorMessage,
    gpsSignal,
    gpsSignalMessage,
    points,
    startedAt,
    status,
    addPoint,
    cancelWorkout,
    finishWorkout,
    pauseWorkout,
    resetWorkout,
    resumeWorkout,
    setErrorMessage,
    setGpsSignal,
    startWorkout,
  } = useActiveWorkoutStore();

  const stopTracking = () => {
    stopLocationTracking(subscriptionRef.current);
    subscriptionRef.current = null;
  };

  const startTracking = async (): Promise<boolean> => {
    const subscription = await startLocationTracking(
      addPoint,
      setErrorMessage,
      (signal) => setGpsSignal(signal.status, signal.message),
    );
    subscriptionRef.current = subscription;

    return subscription !== null;
  };

  const handleStart = async () => {
    setErrorMessage(null);

    const hasPermission = await requestForegroundLocationPermission();

    if (!hasPermission) {
      setErrorMessage('Permissao de localizacao negada.');
      return;
    }

    startWorkout();

    const started = await startTracking();

    if (!started) {
      cancelWorkout();
    }
  };

  const handlePause = () => {
    stopTracking();
    pauseWorkout();
  };

  const handleResume = async () => {
    setErrorMessage(null);

    const started = await startTracking();

    if (started) {
      resumeWorkout();
    }
  };

  const handleCancel = () => {
    stopTracking();
    cancelWorkout();
  };

  const handleFinish = async () => {
    if (!startedAt || isSaving) {
      return;
    }

    setIsSaving(true);
    stopTracking();
    const finishedAt = new Date().toISOString();

    if (status === 'ACTIVE') {
      pauseWorkout();
    }

    try {
      await WorkoutRepository.createCompletedWorkoutWithPoints(
        {
          avgPace: averagePace,
          endedAt: finishedAt,
          startedAt,
          totalDistance: distanceMeters,
          totalDuration: elapsedSeconds,
          type: 'FREE_RUN',
        },
        points.map((point) => ({
          ...point,
          segmentId: null,
        })),
      );
      finishWorkout(finishedAt);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao salvar treino.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (status !== 'ACTIVE') {
      return;
    }

    const intervalId = setInterval(() => {
      const state = useActiveWorkoutStore.getState();
      state.updateMetrics(state.elapsedSeconds + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [status]);

  useEffect(() => stopTracking, []);

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
          <Button fullWidth label="Iniciar treino" onPress={handleStart} />
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
            fullWidth
            label="Retomar"
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

function getStatusLabel(status: string, endedAt: string | null): string {
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

function getGpsSignalLabel(signal: string): string {
  if (signal === 'good') {
    return 'bom';
  }

  if (signal === 'weak') {
    return 'fraco';
  }

  return 'sem sinal confiavel';
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actions: {
    gap: 12,
  },
});
