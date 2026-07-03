import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Screen } from '@/components/ui/Screen';
import { WorkoutRepository } from '@/features/workout/workout.repository';
import type {
  SegmentType,
  Workout,
  WorkoutSegment,
} from '@/features/workout/workout.types';
import { formatDistance, formatDuration, formatPace } from '@/utils/format';

type WorkoutSummaryState = {
  segments: WorkoutSegment[];
  workout: Workout;
};

export default function WorkoutSummaryScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<WorkoutSummaryState | null>(null);

  const loadWorkout = useCallback(async () => {
    if (!id) {
      setErrorMessage('Treino nao encontrado.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const workout = await WorkoutRepository.getWorkoutById(id);

      if (!workout || workout.status !== 'COMPLETED') {
        setSummary(null);
        setErrorMessage('Treino nao encontrado.');
        return;
      }

      const segments =
        workout.type === 'INTERVAL'
          ? await WorkoutRepository.getWorkoutSegments(id)
          : [];

      setSummary({ segments, workout });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao carregar resumo.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadWorkout();
  }, [loadWorkout]);

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Resumo</AppText>
        {summary ? (
          <AppText color="secondary">
            {getWorkoutTypeLabel(summary.workout.type)}
          </AppText>
        ) : null}
      </View>

      {isLoading ? (
        <Card>
          <AppText color="secondary">Carregando resumo...</AppText>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card>
          <AppText variant="subtitle">Erro</AppText>
          <AppText color="secondary">{errorMessage}</AppText>
          <Button label="Tentar novamente" onPress={loadWorkout} />
        </Card>
      ) : null}

      {summary ? (
        <>
          <View style={styles.metrics}>
            <MetricCard
              label="Distancia"
              value={formatDistance(summary.workout.totalDistance)}
            />
            <MetricCard
              label="Duracao"
              value={formatDuration(summary.workout.totalDuration)}
            />
            <MetricCard
              label="Pace medio"
              value={formatPace(summary.workout.avgPace)}
            />
            <MetricCard
              label="Tipo"
              value={getWorkoutTypeLabel(summary.workout.type)}
            />
          </View>

          {summary.workout.type === 'INTERVAL' ? (
            <Card>
              <AppText variant="subtitle">Segmentos</AppText>
              {summary.segments.length > 0 ? (
                <View style={styles.list}>
                  {summary.segments.map((segment) => (
                    <View key={segment.id} style={styles.segment}>
                      <View style={styles.segmentHeader}>
                        <AppText>{getSegmentTypeLabel(segment.type)}</AppText>
                        <AppText color="secondary" variant="caption">
                          {getRepetitionLabel(segment.repetition)}
                        </AppText>
                      </View>
                      <AppText color="secondary" variant="caption">
                        {formatDistance(segment.actualDistance)} -{' '}
                        {formatDuration(segment.actualDuration)} -{' '}
                        {formatPace(segment.avgPace)}
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : (
                <AppText color="secondary">
                  Este treino nao possui segmentos.
                </AppText>
              )}
            </Card>
          ) : null}

          <Button
            label="Ver historico"
            onPress={() => router.replace('/history')}
            variant="secondary"
          />
        </>
      ) : null}
    </Screen>
  );
}

function getWorkoutTypeLabel(type: Workout['type']): string {
  return type === 'INTERVAL' ? 'Treino intervalado' : 'Corrida livre';
}

function getSegmentTypeLabel(type: SegmentType): string {
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
}

function getRepetitionLabel(repetition: number | null): string {
  return repetition ? `Repeticao ${repetition}` : 'Sem repeticao';
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  list: {
    gap: 12,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  segment: {
    gap: 6,
  },
  segmentHeader: {
    gap: 2,
  },
});
