import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';

type MetricCardProps = {
  helper?: string;
  label: string;
  value: string;
};

export function MetricCard({ helper, label, value }: MetricCardProps) {
  return (
    <Card className="min-w-[140px] flex-1">
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
