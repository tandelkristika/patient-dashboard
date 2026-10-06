import {
  getRiskConfig,
  getMeterSegments,
  EMPTY_SEGMENT,
} from '../src/utils/riskConfig.js';

let passed = 0;
let total = 0;

const check = (name, condition) => {
  total += 1;

  if (condition) {
    passed += 1;
  }

  console.log(`${condition ? 'PASS' : 'FAIL'}: ${name}`);
};

const filled = (level) =>
  getMeterSegments(level).filter(
    (s) => s.className !== EMPTY_SEGMENT
  ).length;

check('Low fills 1 segment', filled('Low') === 1);
check('Medium fills 2 segments', filled('Medium') === 2);
check('High fills 3 segments', filled('High') === 3);

check(
  'High uses red',
  getRiskConfig('High').segment === 'bg-red-600'
);

check(
  'Medium uses amber',
  getRiskConfig('Medium').segment === 'bg-amber-600'
);

check(
  'Low uses green',
  getRiskConfig('Low').segment === 'bg-green-600'
);

check(
  'unknown level is "Not assessed", not Low',
  getRiskConfig('Extreme').label === 'Not assessed'
);

check(
  'undefined level is safe',
  getRiskConfig(undefined).label === 'Not assessed'
);

check(
  'unknown level fills 0 segments',
  filled('Extreme') === 0
);

check(
  '"constructor" does not match a config',
  getRiskConfig('constructor').label === 'Not assessed'
);

check(
  'meter always has 3 segments',
  getMeterSegments('Low').length === 3
);

console.log(`\n${passed}/${total} checks passed`);

if (passed !== total) {
  process.exit(1);
}
