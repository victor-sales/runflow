import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Screen } from '@/components/ui/Screen';

const routes = {
  history: '/history' as Href,
  interval: '/workout/interval' as Href,
  settings: '/settings' as Href,
  workout: '/workout' as Href,
};

export default function HomeScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">RunFlow</AppText>
        <AppText color="secondary">
          Corra no seu ritmo, registre treinos localmente e prepare seus intervalados.
        </AppText>
      </View>

      <View style={styles.actions}>
        <Link asChild href="/workout/free-run">
          <Button fullWidth label="Iniciar corrida livre" />
        </Link>
        <Link asChild href={routes.workout}>
          <Button fullWidth label="Escolher treino" variant="secondary" />
        </Link>
      </View>

      <View style={styles.metrics}>
        <MetricCard helper="Sera exibido apos salvar treinos" label="Ultimo treino" value="--" />
        <MetricCard helper="Historico local nas proximas fases" label="Total" value="0 km" />
      </View>

      <Card>
        <AppText variant="subtitle">Atalhos</AppText>
        <View style={styles.cardActions}>
          <Link asChild href={routes.interval}>
            <Button label="Treinos intervalados" variant="secondary" />
          </Link>
          <Link asChild href={routes.history}>
            <Button label="Historico" variant="secondary" />
          </Link>
          <Link asChild href={routes.settings}>
            <Button label="Configuracoes" variant="secondary" />
          </Link>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  actions: {
    gap: 12,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardActions: {
    gap: 10,
  },
});
