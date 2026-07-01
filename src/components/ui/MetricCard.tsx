import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
};

export function MetricCard({ helper, label, value }: MetricCardProps) {
  return (
    <Card style={styles.card}>
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
      <AppText variant="metric">{value}</AppText>
      {helper ? (
        <AppText color="secondary" variant="caption">
          {helper}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
  },
});
