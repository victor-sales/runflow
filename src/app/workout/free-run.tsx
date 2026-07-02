import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/MetricCard';
import { Screen } from '@/components/ui/Screen';

export default function FreeRunScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Corrida livre</AppText>
        <AppText color="secondary">
          Estrutura inicial da tela. GPS, pausa, finalizacao e persistencia
          ficam para fases futuras.
        </AppText>
      </View>

      <View style={styles.metrics}>
        <MetricCard label="Tempo" value="00:00" />
        <MetricCard label="Distancia" value="0,00 km" />
        <MetricCard label="Pace atual" value="--:--" />
        <MetricCard label="Pace medio" value="--:--" />
      </View>

      <View style={styles.actions}>
        <Button disabled fullWidth label="Iniciar treino" />
        <Button disabled fullWidth label="Pausar" variant="secondary" />
        <Button disabled fullWidth label="Finalizar" variant="ghost" />
      </View>
    </Screen>
  );
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
