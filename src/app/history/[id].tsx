import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { WorkoutMap } from '@/components/workout/WorkoutMap';
import { WorkoutRepository } from '@/features/workout/workout.repository';
import type {
  Workout,
  WorkoutPoint,
  WorkoutSegment,
} from '@/features/workout/workout.types';
import { formatDistance, formatDuration, formatPace } from '@/utils/format';

type WorkoutDetailsState = {
  points: WorkoutPoint[];
  segments: WorkoutSegment[];
  workout: Workout;
};

export default function WorkoutHistoryDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [details, setDetails] = useState<WorkoutDetailsState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        setDetails(null);
        setErrorMessage('Treino nao encontrado.');
        return;
      }

      const [points, segments] = await Promise.all([
        WorkoutRepository.getWorkoutPoints(id),
        WorkoutRepository.getWorkoutSegments(id),
      ]);

      setDetails({ points, segments, workout });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao carregar treino.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadWorkout();
  }, [loadWorkout]);

  const deleteWorkout = async () => {
    if (!id || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await WorkoutRepository.deleteWorkout(id);
      router.replace('/history');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao excluir treino.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Screen>
      <AppText variant="title">Detalhe</AppText>

      {isLoading ? (
        <Card>
          <AppText color="secondary">Carregando treino...</AppText>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card>
          <AppText variant="subtitle">Erro</AppText>
          <AppText color="secondary">{errorMessage}</AppText>
          <Button label="Tentar novamente" onPress={loadWorkout} />
        </Card>
      ) : null}

      {details ? (
        <>
          <Card>
            <AppText variant="subtitle">
              {getWorkoutTypeLabel(details.workout.type)}
            </AppText>
            <AppText color="secondary">
              {formatDate(details.workout.startedAt)}
            </AppText>
            <View style={styles.metrics}>
              <Metric
                label="Distancia"
                value={formatDistance(details.workout.totalDistance)}
              />
              <Metric
                label="Duracao"
                value={formatDuration(details.workout.totalDuration)}
              />
              <Metric
                label="Pace medio"
                value={formatPace(details.workout.avgPace)}
              />
              <Metric
                label="Pontos GPS"
                value={String(details.points.length)}
              />
            </View>
          </Card>

          <WorkoutMap
            points={details.points}
            snapshotUri={
              details.points.length === 0
                ? details.workout.routeSnapshotUri
                : null
            }
          />

          <Card>
            <AppText variant="subtitle">Segmentos</AppText>
            {details.segments.length > 0 ? (
              <View style={styles.list}>
                {details.segments.map((segment) => (
                  <View key={segment.id} style={styles.segment}>
                    <AppText>{getSegmentLabel(segment)}</AppText>
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

          <Button
            disabled={isDeleting}
            label={isDeleting ? 'Excluindo...' : 'Excluir treino'}
            onPress={() =>
              Alert.alert(
                'Excluir treino?',
                'Esta acao nao pode ser desfeita.',
                [
                  { style: 'cancel', text: 'Cancelar' },
                  {
                    onPress: deleteWorkout,
                    style: 'destructive',
                    text: 'Excluir',
                  },
                ],
              )
            }
            variant="ghost"
          />
        </>
      ) : null}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText color="secondary" variant="caption">
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function getWorkoutTypeLabel(type: Workout['type']): string {
  return type === 'INTERVAL' ? 'Treino intervalado' : 'Corrida livre';
}

function getSegmentLabel(segment: WorkoutSegment): string {
  const repetition = segment.repetition ? ` ${segment.repetition}` : '';

  return `${segment.orderIndex + 1}. ${segment.type}${repetition}`;
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  metric: {
    minWidth: 120,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  segment: {
    gap: 4,
  },
});
