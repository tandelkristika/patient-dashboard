import {
  AlertTriangle,
  Brain,
  Info,
  ShieldAlert,
} from 'lucide-react';

import RiskBadge from './RiskBadge';
import RiskMeter from './RiskMeter';

import {
  FALLBACK_DISCLAIMER,
  getRiskConfig,
} from '../utils/riskConfig';

function AIResultCard({ insight }) {
  if (!insight) {
    return null;
  }

  const config = getRiskConfig(insight.riskLevel);

  const disclaimer =
    insight.disclaimer || FALLBACK_DISCLAIMER;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Brain
              size={20}
              className="text-blue-600"
              aria-hidden="true"
            />

            <h3 className="text-lg font-bold text-slate-900">
              AI Analysis Result
            </h3>
          </div>

          <p className="text-sm text-slate-500">
            Clinical decision support only
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <RiskBadge riskLevel={insight.riskLevel} />
          <RiskMeter riskLevel={insight.riskLevel} />

          <span className={`text-xs font-medium ${config.text}`}>
            {config.hint}
          </span>
        </div>
      </div>

      {insight.escalatedBySafetyRules && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <ShieldAlert
            size={20}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />

          <div>
            <p className="font-semibold">
              Safety rules escalated this result
            </p>

            <p className="mt-1 text-sm">
              One or more safety-sensitive findings increased
              the reported risk level.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Summary
        </h4>

        <p className="leading-7 text-slate-700">
          {insight.summary || 'No summary available.'}
        </p>
      </div>

      {insight.warningFlags?.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle
              size={18}
              className="text-amber-700"
              aria-hidden="true"
            />

            <h4 className="font-semibold text-amber-900">
              Warning Flags
            </h4>
          </div>

          <ul className="space-y-2">
            {insight.warningFlags.map((flag, index) => (
              <li
                key={`${flag}-${index}`}
                className="flex items-start gap-2 text-sm text-amber-900"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {insight.considerations?.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Info
              size={18}
              className="text-blue-600"
              aria-hidden="true"
            />

            <h4 className="font-semibold text-slate-900">
              Considerations
            </h4>
          </div>

          <ul className="space-y-2">
            {insight.considerations.map((item, index) => (
              <li
                key={`${item}-${index}`}
                className="flex items-start gap-2 text-sm leading-6 text-slate-700"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 border-t border-slate-200 pt-4">
        <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
          <Info
            size={15}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />

          <p>{disclaimer}</p>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-400">
        Provider: {insight.provider || 'mock'}
      </div>
    </section>
  );
}

export default AIResultCard;
