const hexToRgb = (hex) => {
  const value = hex.replace('#', '');

  return [0, 2, 4].map((i) =>
    parseInt(value.slice(i, i + 2), 16)
  );
};

const channel = (c) => {
  const s = c / 255;

  return s <= 0.03928
    ? s / 12.92
    : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(channel);

  return (
    0.2126 * r +
    0.7152 * g +
    0.0722 * b
  );
};

const ratio = (foreground, background) => {
  const a = luminance(foreground);
  const b = luminance(background);

  return (
    (Math.max(a, b) + 0.05) /
    (Math.min(a, b) + 0.05)
  );
};

const WHITE = '#FFFFFF';
const PAGE = '#F8FAFC';

const pairs = [
  ['Main text on card', '#0F172A', WHITE, 4.5],
  ['Muted text on card', '#64748B', WHITE, 4.5],
  ['Muted text on page background', '#64748B', PAGE, 4.5],

  ['White text on primary/600 button', WHITE, '#0D9488', 4.5],
  ['White text on primary/700 button', WHITE, '#0F766E', 4.5],

  ['Link (teal-700) on card', '#0F766E', WHITE, 4.5],

  ['Low badge text', '#166534', '#DCFCE7', 4.5],
  ['Medium badge text', '#92400E', '#FEF3C7', 4.5],
  ['High badge text', '#991B1B', '#FEE2E2', 4.5],

  ['Low risk text on card', '#15803D', WHITE, 4.5],
  ['Medium risk text on card', '#B45309', WHITE, 4.5],
  ['High risk text on card', '#B91C1C', WHITE, 4.5],

  ['Low meter segment (non-text)', '#16A34A', WHITE, 3],
  ['Medium meter segment (non-text)', '#D97706', WHITE, 3],
  ['High meter segment (non-text)', '#DC2626', WHITE, 3],
];

let failures = 0;

pairs.forEach(([name, fg, bg, min]) => {
  const value = ratio(fg, bg);
  const ok = value >= min;

  if (!ok) {
    failures += 1;
  }

  console.log(
    `${ok ? 'PASS' : 'FAIL'}: ${name}  ${value.toFixed(2)}:1  (needs ${min}:1)`
  );
});

console.log(
  `\n${pairs.length - failures}/${pairs.length} pairs meet WCAG AA`
);
