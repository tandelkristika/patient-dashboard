// Full class names only. Never build Tailwind classes by joining strings.
const RISK_CONFIG = {
  Low: {
    label: 'Low risk',
    activeSegments: 1,
    badge: 'bg-green-100 text-green-800 border-green-200',
    segment: 'bg-green-600',
    text: 'text-green-700',
    hint: 'No urgent indicators were identified in the information provided.',
  },

  Medium: {
    label: 'Medium risk',
    activeSegments: 2,
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    segment: 'bg-amber-600',
    text: 'text-amber-700',
    hint: 'Some findings may warrant closer clinical review.',
  },

  High: {
    label: 'High risk',
    activeSegments: 3,
    badge: 'bg-red-100 text-red-800 border-red-200',
    segment: 'bg-red-600',
    text: 'text-red-700',
    hint: 'Described symptoms may need prompt in-person or emergency evaluation.',
  },
};

const UNKNOWN_RISK = {
  label: 'Not assessed',
  activeSegments: 0,
  badge: 'bg-slate-100 text-slate-700 border-slate-200',
  segment: 'bg-slate-300',
  text: 'text-slate-600',
  hint: 'No risk level is available.',
};

export const EMPTY_SEGMENT = 'bg-slate-200';
export const TOTAL_SEGMENTS = 3;

export const FALLBACK_DISCLAIMER =
  'AI-generated information is for clinical decision support only and does not constitute a diagnosis or replace professional medical judgment.';

export const getRiskConfig = (level) =>
  Object.prototype.hasOwnProperty.call(RISK_CONFIG, level)
    ? RISK_CONFIG[level]
    : UNKNOWN_RISK;

export const getMeterSegments = (level) => {
  const { activeSegments, segment } = getRiskConfig(level);

  return Array.from({ length: TOTAL_SEGMENTS }, (_, index) => ({
    id: index,
    className: index < activeSegments ? segment : EMPTY_SEGMENT,
  }));
};
