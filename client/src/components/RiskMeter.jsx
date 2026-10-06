import { getMeterSegments } from '../utils/riskConfig';

function RiskMeter({ riskLevel }) {
  const segments = getMeterSegments(riskLevel);

  return (
    <div
      className="flex w-full max-w-xs gap-1.5"
      aria-label={`Risk meter: ${riskLevel || 'Not assessed'}`}
    >
      {segments.map((segment) => (
        <div
          key={segment.id}
          className={`h-2 flex-1 rounded-full ${segment.className}`}
        />
      ))}
    </div>
  );
}

export default RiskMeter;
