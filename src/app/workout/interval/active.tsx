import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Screen } from '@/components/ui/Screen';
import {
  advanceSegment,
  createIntervalEngine,
  getCurrentSegment,
  getNextSegment,
  type IntervalEngineState,
} from '@/features/interval-training/interval-engine';
import { IntervalTemplateRepository } from '@/features/interval-training/interval-template.repository';
import type { IntervalTemplate } from '@/features/interval-training/interval.types';
import {
  appendIntervalSegmentRuntimePoint,
  calculateIntervalSegmentRuntimeMetrics,
  calculateIntervalWorkoutSegmentSummary,
  createIntervalSegmentRuntime,
  getIntervalSegmentElapsedSeconds,
  mapEngineSegmentsToWorkoutSegmentInputs,
  pauseIntervalSegmentRuntime,
  resumeIntervalSegmentRuntime,
  type IntervalSegmentRuntime,
} from '@/features/interval-training/interval-workout';
import { requestForegroundLocationPermission } from '@/features/location/location-permissions';
import {
  startLocationTracking,
  stopLocationTracking,
  type LocationTrackingSubscription,
} from '@/features/location/location.service';
import type { LocationPoint } from '@/features/location/location.types';
import { WorkoutRepository } from '@/features/workout/workout.repository';
import type {
  SegmentType,
  WorkoutSegment,
} from '@/features/workout/workout.types';
import { useActiveWorkoutStore } from '@/store/active-workout.store';
import { formatDistance, formatDuration, formatPace } from '@/utils/format';

const getSegmentTypeLabel = (type: SegmentType): string => {
  if (type === 'WARMUP') {
    return 'Aquecimento';
  }

  if (type === 'RUN') {
    return 'Tiro';
  }

  if (type === 'REST') {
    return 'Intervalo';
  }

  return 'Desaquecimento';
};

export default function ActiveIntervalWorkoutScreen() {
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();
  const [engineState, setEngineState] = useState<IntervalEngineState | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTrackingStarting, setIsTrackingStarting] = useState(false);
  const [persistedSegments, setPersistedSegments] = useState<WorkoutSegment[]>(
    [],
  );
  const [segmentProgress, setSegmentProgress] = useState(0);
  const [template, setTemplate] = useState<IntervalTemplate | null>(null);
  const engineStateRef = useRef<IntervalEngineState | null>(null);
  const isAdvancingRef = useRef(false);
  const isSavingRef = useRef(false);
  const isTrackingStartingRef = useRef(false);
  const pendingPointWritesRef = useRef<Set<Promise<void>>>(new Set());
  const persistedSegmentsRef = useRef<WorkoutSegment[]>([]);
  const segmentRuntimeRef = useRef<IntervalSegmentRuntime | null>(null);
  const subscriptionRef = useRef<LocationTrackingSubscription | null>(null);
  const trackingRequestIdRef = useRef(0);
  const {
    currentPace,
    currentSegment,
    distanceMeters,
    elapsedSeconds,
    gpsSignal,
    gpsSignalMessage,
    status,
    averagePace,
    cancelWorkout,
    finishWorkout,
    pauseWorkout,
    refreshElapsedSeconds,
    resetWorkout,
    resumeWorkout,
    setCurrentSegment,
    setGpsSignal,
    startWorkout,
  } = useActiveWorkoutStore();

  const setCurrentEngineState = useCallback((state: IntervalEngineState) => {
    engineStateRef.current = state;
    setEngineState(state);
  }, []);

  const trackPointWrite = useCallback((promise: Promise<unknown>) => {
    const trackedPromise = promise
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error ? error.message : 'Falha ao salvar ponto GPS.',
        );
      })
      .then(() => undefined);

    pendingPointWritesRef.current.add(trackedPromise);
    void trackedPromise.finally(() => {
      pendingPointWritesRef.current.delete(trackedPromise);
    });
  }, []);

  const waitForPendingPointWrites = useCallback(async () => {
    await Promise.allSettled([...pendingPointWritesRef.current]);
  }, []);

  const stopForegroundTracking = useCallback(() => {
    trackingRequestIdRef.current += 1;
    stopLocationTracking(subscriptionRef.current);
    subscriptionRef.current = null;
  }, []);

  const stopTracking = useCallback(() => {
    stopForegroundTracking();
  }, [stopForegroundTracking]);

  const saveCurrentSegmentSummary = useCallback(
    async (endedAt: string): Promise<void> => {
      const state = engineStateRef.current;
      const runtime = segmentRuntimeRef.current;

      if (!state || !runtime) {
        return;
      }

      const segment = persistedSegmentsRef.current[state.currentSegmentIndex];

      if (!segment) {
        return;
      }

      await WorkoutRepository.updateWorkoutSegment(
        segment.id,
        calculateIntervalWorkoutSegmentSummary({
          elapsedSeconds: getIntervalSegmentElapsedSeconds(runtime, endedAt),
          endedAt,
          pointGroups: runtime.pointGroups,
          startedAt: runtime.startedAt,
        }),
      );
    },
    [],
  );

  const startSegment = useCallback(
    (segmentIndex: number, startedAt: string) => {
      const segment = persistedSegmentsRef.current[segmentIndex] ?? null;

      segmentRuntimeRef.current = createIntervalSegmentRuntime(startedAt);
      setCurrentSegment(segment);
      setSegmentProgress(0);

      if (segment) {
        void WorkoutRepository.updateWorkoutSegment(segment.id, {
          endedAt: null,
          startedAt,
        });
      }
    },
    [setCurrentSegment],
  );

  const finishIntervalWorkout = useCallback(
    async (
      finishedAt: string,
      options: { saveSegmentSummary: boolean } = { saveSegmentSummary: true },
    ) => {
      const state = useActiveWorkoutStore.getState();

      if (!state.workoutId || isSavingRef.current) {
        return;
      }

      isSavingRef.current = true;
      setIsSaving(true);

      try {
        await stopTracking();

        if (options.saveSegmentSummary) {
          await saveCurrentSegmentSummary(finishedAt);
        }

        await waitForPendingPointWrites();
        finishWorkout(finishedAt);

        const finishedState = useActiveWorkoutStore.getState();

        await WorkoutRepository.finishWorkout(state.workoutId, {
          avgPace: finishedState.averagePace,
          endedAt: finishedAt,
          totalDistance: finishedState.distanceMeters,
          totalDuration: finishedState.elapsedSeconds,
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Falha ao salvar treino.',
        );
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    },
    [
      finishWorkout,
      saveCurrentSegmentSummary,
      stopTracking,
      waitForPendingPointWrites,
    ],
  );

  const evaluateSegmentProgress = useCallback(
    async (now = new Date().toISOString()) => {
      const state = engineStateRef.current;
      const runtime = segmentRuntimeRef.current;
      const currentEngineSegment = state ? getCurrentSegment(state) : null;

      if (
        !state ||
        !runtime ||
        !currentEngineSegment ||
        isAdvancingRef.current ||
        useActiveWorkoutStore.getState().status !== 'ACTIVE'
      ) {
        return;
      }

      const metrics = calculateIntervalSegmentRuntimeMetrics(
        currentEngineSegment,
        runtime,
        now,
      );

      setSegmentProgress(metrics.progress);

      if (metrics.progress < 1) {
        return;
      }

      isAdvancingRef.current = true;

      try {
        await saveCurrentSegmentSummary(now);
        const nextState = advanceSegment(state);

        setCurrentEngineState(nextState);

        if (nextState.status === 'COMPLETED') {
          setCurrentSegment(null);
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => undefined);
          await finishIntervalWorkout(now, { saveSegmentSummary: false });
          return;
        }

        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
          () => undefined,
        );
        startSegment(nextState.currentSegmentIndex, now);
      } finally {
        isAdvancingRef.current = false;
      }
    },
    [
      finishIntervalWorkout,
      saveCurrentSegmentSummary,
      setCurrentEngineState,
      setCurrentSegment,
      startSegment,
    ],
  );

  const handleLocationPoint = useCallback(
    (point: LocationPoint) => {
      const state = useActiveWorkoutStore.getState();
      const engine = engineStateRef.current;
      const segment = engine
        ? persistedSegmentsRef.current[engine.currentSegmentIndex]
        : null;

      state.addPoint(point);

      if (state.status !== 'ACTIVE' || !state.workoutId || !segment) {
        return;
      }

      if (segmentRuntimeRef.current) {
        segmentRuntimeRef.current = appendIntervalSegmentRuntimePoint(
          segmentRuntimeRef.current,
          point,
        );
      }

      trackPointWrite(
        WorkoutRepository.addWorkoutPoint({
          ...point,
          segmentId: segment.id,
          workoutId: state.workoutId,
        }),
      );

      void evaluateSegmentProgress(point.timestamp);
    },
    [evaluateSegmentProgress, trackPointWrite],
  );

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
  }, [handleLocationPoint, setGpsSignal]);

  const handleStart = async () => {
    if (!template || isTrackingStartingRef.current || subscriptionRef.current) {
      return;
    }

    setErrorMessage(null);

    const hasForegroundPermission = await requestForegroundLocationPermission();

    if (!hasForegroundPermission) {
      setErrorMessage('Permissao de localizacao negada.');
      return;
    }

    const startedAt = new Date().toISOString();
    const newEngineState = createIntervalEngine(template);

    if (newEngineState.status === 'COMPLETED') {
      setErrorMessage('Template sem segmentos para executar.');
      return;
    }

    const workout = await WorkoutRepository.createWorkout({
      startedAt,
      status: 'ACTIVE',
      type: 'INTERVAL',
    });
    const segments = await WorkoutRepository.addWorkoutSegments(
      mapEngineSegmentsToWorkoutSegmentInputs(
        workout.id,
        newEngineState.segments,
        startedAt,
      ),
    );

    persistedSegmentsRef.current = segments;
    setPersistedSegments(segments);
    setCurrentEngineState(newEngineState);
    startWorkout(startedAt, workout.id);
    startSegment(newEngineState.currentSegmentIndex, startedAt);

    const started = await startTracking();

    if (!started) {
      await WorkoutRepository.cancelWorkout(workout.id);
      cancelWorkout();
      setCurrentSegment(null);
    }
  };

  const handlePause = async () => {
    const state = useActiveWorkoutStore.getState();
    const runtime = segmentRuntimeRef.current;

    if (!state.workoutId || state.status !== 'ACTIVE') {
      return;
    }

    const pausedAt = new Date().toISOString();

    await stopTracking();
    await waitForPendingPointWrites();

    if (runtime) {
      segmentRuntimeRef.current = pauseIntervalSegmentRuntime(
        runtime,
        pausedAt,
      );
    }

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
      !state.workoutId ||
      state.status !== 'PAUSED'
    ) {
      return;
    }

    setErrorMessage(null);

    const resumedAt = new Date().toISOString();
    const started = await startTracking();

    if (!started) {
      return;
    }

    if (segmentRuntimeRef.current) {
      segmentRuntimeRef.current = resumeIntervalSegmentRuntime(
        segmentRuntimeRef.current,
        resumedAt,
      );
    }

    resumeWorkout(resumedAt);
    const resumedState = useActiveWorkoutStore.getState();

    await WorkoutRepository.updateWorkout(state.workoutId, {
      avgPace: resumedState.averagePace,
      status: 'ACTIVE',
      totalDistance: resumedState.distanceMeters,
      totalDuration: resumedState.elapsedSeconds,
    });
  };

  const handleCancel = async () => {
    const state = useActiveWorkoutStore.getState();

    await stopTracking();

    if (state.workoutId) {
      await WorkoutRepository.cancelWorkout(state.workoutId);
    }

    cancelWorkout();
    setCurrentSegment(null);
    setEngineState(null);
    engineStateRef.current = null;
    segmentRuntimeRef.current = null;
  };

  const handleFinish = async () => {
    await finishIntervalWorkout(new Date().toISOString());
  };

  useEffect(() => {
    let isMounted = true;

    async function loadTemplate(): Promise<void> {
      if (!templateId) {
        setErrorMessage('Template nao informado.');
        setIsLoading(false);
        return;
      }

      try {
        const loadedTemplate =
          await IntervalTemplateRepository.getIntervalTemplateById(templateId);

        if (!isMounted) {
          return;
        }

        if (!loadedTemplate) {
          setErrorMessage('Template nao encontrado.');
          return;
        }

        setTemplate(loadedTemplate);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Falha ao carregar treino.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTemplate();

    return () => {
      isMounted = false;
    };
  }, [templateId]);

  useEffect(() => {
    if (status !== 'ACTIVE') {
      return;
    }

    const intervalId = setInterval(() => {
      const now = new Date().toISOString();

      refreshElapsedSeconds(now);
      void evaluateSegmentProgress(now);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [evaluateSegmentProgress, refreshElapsedSeconds, status]);

  useEffect(
    () => () => {
      stopForegroundTracking();
    },
    [stopForegroundTracking],
  );

  const currentEngineSegment = engineState
    ? getCurrentSegment(engineState)
    : null;
  const nextEngineSegment = engineState ? getNextSegment(engineState) : null;
  const canStart =
    status === 'IDLE' || status === 'CANCELED' || status === 'COMPLETED';
  const canFinish = status === 'ACTIVE' || status === 'PAUSED';

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Treino intervalado</AppText>
        <AppText color="secondary">
          {template ? template.name : 'Carregando template...'}
        </AppText>
        {status === 'ACTIVE' ? (
          <AppText color="secondary" variant="caption">
            GPS: {getGpsSignalLabel(gpsSignal)}
          </AppText>
        ) : null}
      </View>

      {isLoading ? (
        <Card>
          <AppText color="secondary">Carregando treino...</AppText>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card>
          <AppText variant="subtitle">Aviso</AppText>
          <AppText color="secondary">{errorMessage}</AppText>
        </Card>
      ) : null}

      {currentEngineSegment ? (
        <Card>
          <View style={styles.segmentHeader}>
            <AppText variant="subtitle">
              {getSegmentTypeLabel(currentEngineSegment.type)}
            </AppText>
            <AppText color="secondary">
              {currentEngineSegment.repetition
                ? `Repeticao ${currentEngineSegment.repetition}`
                : 'Sem repeticao'}
            </AppText>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(segmentProgress * 100)}%` },
              ]}
            />
          </View>
          <AppText color="secondary" variant="caption">
            Progresso {Math.round(segmentProgress * 100)}%
          </AppText>
          <AppText color="secondary" variant="caption">
            Proximo:{' '}
            {nextEngineSegment
              ? getSegmentTypeLabel(nextEngineSegment.type)
              : 'Finalizacao'}
          </AppText>
        </Card>
      ) : null}

      <View style={styles.metrics}>
        <MetricCard label="Tempo" value={formatDuration(elapsedSeconds)} />
        <MetricCard label="Distancia" value={formatDistance(distanceMeters)} />
        <MetricCard label="Pace atual" value={formatPace(currentPace)} />
        <MetricCard label="Pace medio" value={formatPace(averagePace)} />
      </View>

      {currentSegment ? (
        <AppText color="secondary" variant="caption">
          Segmento salvo: {currentSegment.id}
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
            disabled={isLoading || isTrackingStarting || !template}
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
            label="Voltar aos templates"
            onPress={() => {
              resetWorkout();
              router.back();
            }}
            variant="secondary"
          />
        ) : null}
      </View>

      {persistedSegments.length > 0 ? (
        <AppText color="secondary" variant="caption">
          Segmentos criados: {persistedSegments.length}
        </AppText>
      ) : null}
    </Screen>
  );
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
  progressBar: {
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#111827',
    height: '100%',
  },
  segmentHeader: {
    gap: 4,
  },
});
