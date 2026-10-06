const {
  getLastMonths,
  buildMonthlyVisits,
  countAppointments,
  countPendingAnalyses,
  countCriticalAlerts,
} = require('../src/utils/dashboardMetrics');

const TODAY = '2026-10-06';

const d = (s) =>
  new Date(`${s}T00:00:00.000Z`);

const appointments = [
  {
    _id: 'a1',
    appointmentDate: d('2026-10-06'),
    status: 'Scheduled',
    symptoms: 'cough',
  },
  {
    _id: 'a2',
    appointmentDate: d('2026-10-20'),
    status: 'Scheduled',
    symptoms: '',
  },
  {
    _id: 'a3',
    appointmentDate: d('2026-10-01'),
    status: 'Completed',
    symptoms: 'headache',
  },
  {
    _id: 'a4',
    appointmentDate: d('2026-09-15'),
    status: 'Completed',
    symptoms: 'cough',
  },
  {
    _id: 'a5',
    appointmentDate: d('2026-09-10'),
    status: 'Cancelled',
    symptoms: 'rash',
  },
  {
    _id: 'a6',
    appointmentDate: d('2026-08-02'),
    status: 'Completed',
    symptoms: '',
  },
  {
    _id: 'a7',
    appointmentDate: d('2026-10-03'),
    status: 'Completed',
    symptoms: 'fever',
  },
];

const insights = [
  {
    patientId: 'p1',
    riskLevel: 'Low',
    generatedAt: d('2026-10-01'),
    appointmentId: null,
  },
  {
    patientId: 'p1',
    riskLevel: 'High',
    generatedAt: d('2026-10-05'),
    appointmentId: null,
  },
  {
    patientId: 'p2',
    riskLevel: 'High',
    generatedAt: d('2026-09-01'),
    appointmentId: 'a4',
  },
  {
    patientId: 'p2',
    riskLevel: 'Low',
    generatedAt: d('2026-10-02'),
    appointmentId: null,
  },
  {
    patientId: 'p3',
    riskLevel: 'High',
    generatedAt: d('2026-10-04'),
    appointmentId: null,
  },
];

console.log(
  '--- Test 1: last 6 months ---'
);

console.log(
  getLastMonths(TODAY, 6).map(
    (m) => `${m.key} ${m.label}`
  )
);

console.log(
  '--- Test 2: monthly visits ---'
);

console.log(
  buildMonthlyVisits(
    appointments,
    TODAY
  ).map(
    (m) => `${m.month} ${m.visits}`
  )
);

console.log(
  '--- Test 3: appointment counts ---'
);

console.log(
  countAppointments(
    appointments,
    TODAY
  )
);

console.log(
  '--- Test 4: pending analyses ---'
);

console.log(
  countPendingAnalyses(
    appointments,
    insights
  )
);

console.log(
  '--- Test 5: critical alerts ---'
);

console.log(
  countCriticalAlerts(insights)
);

console.log(
  '--- Test 6: year rollover ---'
);

console.log(
  getLastMonths(
    '2027-01-15',
    6
  ).map(
    (m) => `${m.key} ${m.label}`
  )
);
