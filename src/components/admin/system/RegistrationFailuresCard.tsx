import { AlertTriangle, CheckCircle, Mail } from 'lucide-react';
import { AnalyticsCard } from '@/components/admin/AnalyticsCard';
import { useRegistrationFailuresStats } from '@/hooks/useRegistrationFailures';

export function RegistrationFailuresCard() {
  const { data: stats, isLoading } = useRegistrationFailuresStats();

  const hasUnresolved = (stats?.unresolved || 0) > 0;
  const status = hasUnresolved ? 'error' : 'healthy';

  const secondaryMetrics = [
    {
      label: 'Total Failures',
      value: stats?.total || 0,
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      label: 'Resolved',
      value: stats?.resolved || 0,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      label: 'Alerts Sent',
      value: stats?.alertsSent || 0,
      icon: Mail,
      color: 'text-blue-600'
    }
  ];

  return (
    <AnalyticsCard
      title="Registration Health"
      value={stats?.unresolved || 0}
      description={hasUnresolved ? "Issues need attention" : "All systems operational"}
      icon={hasUnresolved ? AlertTriangle : CheckCircle}
      isLoading={isLoading}
      status={status}
      secondaryMetrics={secondaryMetrics}
    />
  );
}