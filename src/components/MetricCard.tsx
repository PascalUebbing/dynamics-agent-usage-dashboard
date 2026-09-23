import { Card, Text } from '@fluentui/react-components';

interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
}

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <Card className="metric-card" appearance="outline">
      <Text size={200} className="metric-label">
        {label}
      </Text>
      <Text as="span" size={700} weight="semibold" className="metric-value">
        {value}
      </Text>
      {detail ? (
        <Text size={200} className="metric-detail">
          {detail}
        </Text>
      ) : null}
    </Card>
  );
}
