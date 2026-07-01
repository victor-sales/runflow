import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';

export default function IntervalWorkoutListScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Treinos intervalados</AppText>
        <AppText color="secondary">
          Seus modelos de tiro aparecerao aqui quando a persistencia local for implementada.
        </AppText>
      </View>

      <Card>
        <AppText variant="subtitle">Nenhum treino criado</AppText>
        <AppText color="secondary">
          A criacao de templates ainda e apenas uma tela de bootstrap nesta fase.
        </AppText>
        <Link asChild href="/workout/interval/create">
          <Button label="Criar treino intervalado" />
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
