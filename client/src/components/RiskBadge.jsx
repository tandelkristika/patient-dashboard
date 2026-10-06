import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getRiskConfig } from '../utils/riskConfig';

function RiskBadge({ riskLevel }) {
  const config = getRiskConfig(riskLevel);

  const Icon =
    riskLevel === 'High'
      ? ShieldAlert
      : riskLevel === 'Medium'
        ? AlertTriangle
        : riskLevel === 'Low'
          ? CheckCircle2
          : AlertTriangle;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${config.badge}`}
      aria-label={`Risk level: ${config.label}`}
    >
      <Icon size={16} aria-hidden="true" />
      <span>{config.label}</span>
    </div>
  );
}

export default RiskBadge;
