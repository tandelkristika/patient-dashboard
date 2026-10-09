import {
  AlertTriangle,
  Brain,
  Clock3,
  Info,
  ShieldAlert,
} from 'lucide-react';

import RiskBadge from './RiskBadge';
import RiskMeter from './RiskMeter';

import {
  FALLBACK_DISCLAIMER,
  getRiskConfig,
} from '../utils/riskConfig';

// Shows the time only when the saved insight actually has a valid date
const formatGeneratedAt = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleString();
};

function AIResultCard({ insight }) {
  if (!insight) {
    return null;
  }

  const config = getRiskConfig(insight.riskLevel);

  const disclaimer =
    insight.disclaimer || FALLBACK_DISCLAIMER;

  const provider = insight.provider || 'mock';
  const isMock = provider === 'mock';

  const generatedAt = formatGeneratedAt(
    insight.createdAt || insight.generatedAt
  );

  // Tailwind's reset is not loaded in this app, so margins and list
  // styles are set explicitly (m-0, list-none, p-0) on every element.
  return (
    <section
      className="mt-6 w-full min-w-0 break-words rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      aria-label="AI analysis result"
    >
      {/* ---------- Heading + risk ---------- */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <Brain
              size={22}
              className="shrink-0 text-blue-600"
              aria-hidden="true"
            />

            <h3 className="m-0 text-lg font-bold text-slate-900">
              AI Analysis Result
            </h3>
          </div>

          <p className="m-0 text-sm text-slate-600">
            Clinical decision support only. Not a diagnosis.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <RiskBadge riskLevel={insight.riskLevel} />
          <RiskMeter riskLevel={insight.riskLevel} />

          <span
            className={`text-xs font-medium sm:text-right ${config.text}`}
          >
            {config.hint}
          </span>
        </div>
      </div>

      {/* ---------- Demo-output notice (mock provider only) ---------- */}
      {isMock && (
        <div
          role="note"
          className="mt-5 flex items-start gap-3 rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-800"
        >
          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0 text-slate-600"
            aria-hidden="true"
          />

          <div>
            <p className="m-0 text-sm font-semibold">
              Demo output
            </p>

            <p className="m-0 mt-1 text-sm leading-6">
              This result came from the built-in mock provider.
              It is placeholder text, not a real clinical
              analysis.
            </p>
          </div>
        </div>
      )}

      {/* ---------- Safety escalation ---------- */}
      {insight.escalatedBySafetyRules && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
        >
          <ShieldAlert
            size={20}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />

          <div>
            <p className="m-0 text-sm font-semibold">
              Safety rules escalated this result
            </p>

            <p className="m-0 mt-1 text-sm leading-6">
              One or more safety-sensitive findings increased
              the reported risk level.
            </p>
          </div>
        </div>
      )}

      {/* ---------- Summary ---------- */}
      <div className="mt-6">
        <h4 className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          Summary
        </h4>

        <p className="m-0 text-sm leading-7 text-slate-800 sm:text-base">
          {insight.summary || 'No summary available.'}
        </p>
      </div>

      {/* ---------- Warning flags ---------- */}
      {insight.warningFlags?.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle
              size={18}
              className="shrink-0 text-amber-700"
              aria-hidden="true"
            />

            <h4 className="m-0 text-sm font-semibold text-amber-900">
              Warning Flags
            </h4>
          </div>

          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {insight.warningFlags.map((flag, index) => (
              <li
                key={`${flag}-${index}`}
                className="flex items-start gap-2 text-sm leading-6 text-amber-900"
              >
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600"
                  aria-hidden="true"
                />
                <span className="min-w-0">{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------- Clinical considerations ---------- */}
      {insight.considerations?.length > 0 && (
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Info
              size={18}
              className="shrink-0 text-blue-600"
              aria-hidden="true"
            />

            <h4 className="m-0 text-sm font-semibold text-slate-900">
              Clinical Considerations
            </h4>
          </div>

          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {insight.considerations.map((item, index) => (
              <li
                key={`${item}-${index}`}
                className="flex items-start gap-2 text-sm leading-6 text-slate-800"
              >
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"
                  aria-hidden="true"
                />
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------- Safety disclaimer ---------- */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-2 text-sm leading-6 text-slate-700">
          <Info
            size={16}
            className="mt-1 shrink-0"
            aria-hidden="true"
          />

          <p className="m-0">{disclaimer}</p>
        </div>
      </div>

      {/* ---------- Provider information ---------- */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        <span>Provider: {provider}</span>

        {generatedAt && (
          <span className="inline-flex items-center gap-1">
            <Clock3 size={13} aria-hidden="true" />
            {generatedAt}
          </span>
        )}
      </div>
    </section>
  );
}

export default AIResultCard;
