const RISK_ORDER = ['Low', 'Medium', 'High'];

// Minimum risk level when a red-flag phrase is detected
const RED_FLAG_RULES = [
  {
    label: 'Chest pain or pressure',
    minRisk: 'High',
    pattern: /chest\s+(pain|pressure|tightness)/i,
  },
  {
    label: 'Difficulty breathing',
    minRisk: 'High',
    pattern:
      /(trouble|difficulty|shortness\s+of)\s+breath|can'?t\s+breathe|breathless/i,
  },
  {
    label: 'Stroke-like symptoms',
    minRisk: 'High',
    pattern:
      /face\s+droop|slurred\s+speech|sudden\s+(weakness|numbness|confusion)|one[-\s]sided\s+weakness/i,
  },
  {
    label: 'Loss of consciousness or seizure',
    minRisk: 'High',
    pattern:
      /faint(ed|ing)|passed\s+out|unconscious|unresponsive|seizure/i,
  },
  {
    label: 'Severe bleeding',
    minRisk: 'High',
    pattern:
      /severe\s+bleeding|heavy\s+bleeding|coughing\s+(up\s+)?blood|vomiting\s+blood|blood\s+in\s+(stool|vomit)/i,
  },
  {
    label: 'Suicidal thoughts or self-harm',
    minRisk: 'High',
    pattern:
      /suicid|self[-\s]harm|want\s+to\s+die|kill\s+(myself|himself|herself)/i,
  },
  {
    label: 'Severe allergic reaction',
    minRisk: 'High',
    pattern:
      /anaphyla|throat\s+(swelling|closing)|swollen\s+(tongue|lips)/i,
  },
  {
    label: 'Severe headache',
    minRisk: 'Medium',
    pattern: /(severe|worst)\s+headache|thunderclap/i,
  },
];

const raiseRisk = (current, minimum) => {
  if (!minimum) return current;

  return RISK_ORDER[
    Math.max(
      RISK_ORDER.indexOf(current),
      RISK_ORDER.indexOf(minimum)
    )
  ];
};

// Returns:
// {
//   labels: [...],
//   minRisk: 'High' | 'Medium' | null
// }
const detectRedFlags = (text) => {
  const matches = RED_FLAG_RULES.filter((rule) =>
    rule.pattern.test(text || '')
  );

  const minRisk = matches.reduce(
    (highest, rule) =>
      raiseRisk(highest || 'Low', rule.minRisk),
    null
  );

  return {
    labels: matches.map((rule) => rule.label),
    minRisk,
  };
};

module.exports = {
  RISK_ORDER,
  detectRedFlags,
  raiseRisk,
};
