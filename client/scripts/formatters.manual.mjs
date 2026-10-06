import {
  formatDate,
  formatTimeSlot,
  getInitials,
  truncate,
} from '../src/utils/formatters.js';

let passed = 0;
let total = 0;

const check = (name, condition) => {
  total += 1;

  if (condition) {
    passed += 1;
  }

  console.log(`${condition ? 'PASS' : 'FAIL'}: ${name}`);
};

check(
  'date formats as "6 Oct 2026"',
  formatDate('2026-10-06T00:00:00.000Z') === '6 Oct 2026'
);

check(
  'midnight UTC does not shift a day',
  formatDate('2026-01-01T00:00:00.000Z') === '1 Jan 2026'
);

check(
  'missing date shows a dash',
  formatDate(null) === '-' &&
    formatDate(undefined) === '-'
);

check(
  'garbage date shows a dash',
  formatDate('not a date') === '-'
);

check(
  '14:30 -> 2:30 PM',
  formatTimeSlot('14:30') === '2:30 PM'
);

check(
  '00:05 -> 12:05 AM',
  formatTimeSlot('00:05') === '12:05 AM'
);

check(
  '12:00 -> 12:00 PM',
  formatTimeSlot('12:00') === '12:00 PM'
);

check(
  'bad slot shows a dash',
  formatTimeSlot('25:99') === '-' &&
    formatTimeSlot(undefined) === '-'
);

check(
  'initials for two names',
  getInitials('jane doe') === 'JD'
);

check(
  'initials for three names use first and last',
  getInitials('Mary Ann Smith') === 'MS'
);

check(
  'initials for one name',
  getInitials('Plato') === 'P'
);

check(
  'initials for blank or non-text input',
  getInitials('   ') === '?' &&
    getInitials(null) === '?'
);

check(
  'short text is unchanged',
  truncate('short', 60) === 'short'
);

check(
  'long text is shortened with an ellipsis',
  truncate('x'.repeat(100), 10).length === 10 &&
    truncate('x'.repeat(100), 10).endsWith('…')
);

check(
  'non-text becomes empty string',
  truncate(undefined) === ''
);

console.log(`\n${passed}/${total} checks passed`);