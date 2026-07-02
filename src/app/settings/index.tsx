import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';

export default function SettingsScreen() {
  return (
    <Screen>
      <AppText variant="title">Configuracoes</AppText>

      <Card>
        <AppText variant="subtitle">Preferencias</AppText>
        <AppText color="secondary">
          Tema, unidades e alertas poderao ser ajustados em fases futuras do
          MVP.
        </AppText>
      </Card>
    </Screen>
  );
}
