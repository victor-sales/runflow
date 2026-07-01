import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';

const fields = [
  'Nome',
  'Aquecimento',
  'Tipo do tiro',
  'Valor do tiro',
  'Quantidade de tiros',
  'Tipo do intervalo',
  'Valor do intervalo',
  'Desaquecimento',
];

export default function CreateIntervalWorkoutScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Criar treino</AppText>
        <AppText color="secondary">
          Formulario, validacao com Zod e salvamento entram na fase de templates intervalados.
        </AppText>
      </View>

      <Card>
        {fields.map((field) => (
          <View key={field} style={styles.placeholderField}>
            <AppText color="muted" variant="caption">
              {field}
            </AppText>
            <AppText color="secondary">A configurar</AppText>
          </View>
        ))}
        <Button disabled fullWidth label="Salvar treino" />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  placeholderField: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
});
