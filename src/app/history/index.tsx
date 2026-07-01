import { Link, type Href } from 'expo-router';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';

const workoutHref = '/workout' as Href;

export default function HistoryScreen() {
  return (
    <Screen>
      <AppText variant="title">Historico</AppText>

      <Card>
        <AppText variant="subtitle">Sem treinos salvos</AppText>
        <AppText color="secondary">
          A listagem local sera conectada apos a fase de banco e corrida livre.
        </AppText>
        <Link asChild href={workoutHref}>
          <Button label="Escolher treino" variant="secondary" />
        </Link>
      </Card>
    </Screen>
  );
}
