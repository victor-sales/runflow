import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';

export default function WorkoutTypeScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Escolha o treino</AppText>
        <AppText color="secondary">
          Nesta fase, as telas sao estruturais. A execucao real entra nas fases seguintes.
        </AppText>
      </View>

      <Card>
        <AppText variant="subtitle">Corrida livre</AppText>
        <AppText color="secondary">Tela preparada para receber GPS, metricas e controles.</AppText>
        <Link asChild href="/workout/free-run">
          <Button label="Abrir corrida livre" />
        </Link>
      </Card>

      <Card>
        <AppText variant="subtitle">Treino intervalado</AppText>
        <AppText color="secondary">Lista e criacao de modelos de treino intervalado.</AppText>
        <Link asChild href="/workout/interval">
          <Button label="Ver treinos intervalados" variant="secondary" />
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
});
