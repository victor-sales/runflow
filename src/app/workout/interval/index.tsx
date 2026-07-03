import { useCallback, useState } from 'react';
import { Link, useFocusEffect, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { IntervalTemplateRepository } from '@/features/interval-training/interval-template.repository';
import type { IntervalTemplate } from '@/features/interval-training/interval.types';
import type { TargetType } from '@/features/workout/workout.types';
import { formatDistance, formatDuration } from '@/utils/format';

const createHref = '/workout/interval/create' as Href;

const getActiveHref = (templateId: string): Href =>
  `/workout/interval/active?templateId=${encodeURIComponent(templateId)}` as Href;

export default function IntervalWorkoutListScreen() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<IntervalTemplate[]>([]);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setTemplates(await IntervalTemplateRepository.listIntervalTemplates());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao carregar treinos.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTemplates();
    }, [loadTemplates]),
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <AppText variant="title">Treinos intervalados</AppText>
          <AppText color="secondary">
            Crie modelos com aquecimento, tiros, intervalos e desaquecimento.
          </AppText>
        </View>

        <Link asChild href={createHref}>
          <Button label="Criar treino" />
        </Link>
      </View>

      {isLoading ? (
        <Card>
          <AppText color="secondary">Carregando templates...</AppText>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card>
          <AppText variant="subtitle">Erro ao carregar</AppText>
          <AppText color="secondary">{errorMessage}</AppText>
          <Button label="Tentar novamente" onPress={loadTemplates} />
        </Card>
      ) : null}

      {!isLoading && !errorMessage && templates.length === 0 ? (
        <Card>
          <AppText variant="subtitle">Nenhum treino criado</AppText>
          <AppText color="secondary">
            Crie seu primeiro template de treino intervalado.
          </AppText>
          <Link asChild href={createHref}>
            <Button label="Criar treino intervalado" variant="secondary" />
          </Link>
        </Card>
      ) : null}

      {!isLoading && !errorMessage ? (
        <View style={styles.list}>
          {templates.map((template) => (
            <Card key={template.id}>
              <View style={styles.cardHeader}>
                <AppText variant="subtitle">{template.name}</AppText>
                <AppText color="secondary" variant="caption">
                  {template.shotsCount} tiros
                </AppText>
              </View>

              <View style={styles.metrics}>
                <Metric
                  label="Aquecimento"
                  value={formatDuration(template.warmupDuration)}
                />
                <Metric
                  label="Tiro"
                  value={formatTarget(
                    template.shotTargetType,
                    template.shotTargetValue,
                  )}
                />
                <Metric
                  label="Intervalo"
                  value={formatTarget(
                    template.restTargetType,
                    template.restTargetValue,
                  )}
                />
                <Metric
                  label="Desaquecimento"
                  value={formatDuration(template.cooldownDuration)}
                />
              </View>

              <Link asChild href={getActiveHref(template.id)}>
                <Button label="Iniciar" variant="secondary" />
              </Link>
            </Card>
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

function formatTarget(type: TargetType, value: number): string {
  return type === 'TIME' ? formatDuration(value) : formatDistance(value);
}

const styles = StyleSheet.create({
  cardHeader: {
    gap: 4,
  },
  header: {
    gap: 14,
  },
  list: {
    gap: 12,
  },
  metric: {
    minWidth: 130,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  titleBlock: {
    gap: 10,
  },
});
