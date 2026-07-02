import { useCallback, useState } from 'react';
import { Link, useFocusEffect, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { WorkoutRepository } from '@/features/workout/workout.repository';
import type { Workout } from '@/features/workout/workout.types';
import { formatDistance, formatDuration, formatPace } from '@/utils/format';

const workoutHref = '/workout' as Href;

export default function HistoryScreen() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const loadWorkouts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setWorkouts(await WorkoutRepository.listCompletedWorkouts());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao carregar historico.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadWorkouts();
    }, [loadWorkouts]),
  );

  return (
    <Screen>
      <AppText variant="title">Historico</AppText>

      {isLoading ? (
        <Card>
          <AppText color="secondary">Carregando treinos...</AppText>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card>
          <AppText variant="subtitle">Erro ao carregar</AppText>
          <AppText color="secondary">{errorMessage}</AppText>
          <Button label="Tentar novamente" onPress={loadWorkouts} />
        </Card>
      ) : null}

      {!isLoading && !errorMessage && workouts.length === 0 ? (
        <Card>
          <AppText variant="subtitle">Sem treinos salvos</AppText>
          <AppText color="secondary">
            Finalize uma corrida livre para ver o resumo no historico.
          </AppText>
          <Link asChild href={workoutHref}>
            <Button label="Escolher treino" variant="secondary" />
          </Link>
        </Card>
      ) : null}

      {!isLoading && !errorMessage ? (
        <View style={styles.list}>
          {workouts.map((workout) => (
            <Link
              asChild
              href={`/history/${workout.id}` as Href}
              key={workout.id}
            >
              <Pressable>
                <Card>
                  <View style={styles.cardHeader}>
                    <AppText variant="subtitle">
                      {getWorkoutTypeLabel(workout.type)}
                    </AppText>
                    <AppText color="secondary" variant="caption">
                      {formatDate(workout.startedAt)}
                    </AppText>
                  </View>
                  <View style={styles.metrics}>
                    <Metric
                      label="Distancia"
                      value={formatDistance(workout.totalDistance)}
                    />
                    <Metric
                      label="Duracao"
                      value={formatDuration(workout.totalDuration)}
                    />
                    <Metric
                      label="Pace medio"
                      value={formatPace(workout.avgPace)}
                    />
                  </View>
                </Card>
              </Pressable>
            </Link>
          ))}
        </View>
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

const styles = StyleSheet.create({
  cardHeader: {
    gap: 4,
  },
  list: {
    gap: 12,
  },
  metric: {
    minWidth: 120,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
