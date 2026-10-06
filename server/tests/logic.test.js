const {
  canTransition,
} = require('../src/utils/appointmentStatus');

const {
  getDayRange,
} = require('../src/utils/dateUtils');

const {
  detectRedFlags,
} = require('../src/utils/redFlags');

const {
  getLastMonths,
  buildMonthlyVisits,
  countAppointments,
  countPendingAnalyses,
  countCriticalAlerts,
} = require('../src/utils/dashboardMetrics');

describe('appointment status rules', () => {
  test('Scheduled can become Completed or Cancelled', () => {
    expect(
      canTransition(
        'Scheduled',
        'Completed'
      )
    ).toBe(true);

    expect(
      canTransition(
        'Scheduled',
        'Cancelled'
      )
    ).toBe(true);
  });

  test('final statuses cannot change', () => {
    expect(
      canTransition(
        'Completed',
        'Scheduled'
      )
    ).toBe(false);

    expect(
      canTransition(
        'Cancelled',
        'Completed'
      )
    ).toBe(false);
  });
});

describe('date helpers', () => {
  test('day range spans exactly 24 hours in UTC', () => {
    const {
      start,
      end,
    } = getDayRange('2099-12-31');

    expect(
      start.toISOString()
    ).toBe(
      '2099-12-31T00:00:00.000Z'
    );

    expect(
      end.toISOString()
    ).toBe(
      '2100-01-01T00:00:00.000Z'
    );
  });
});

describe('red flag detection', () => {
  test('chest pain forces High', () => {
    expect(
      detectRedFlags(
        'sudden chest pain'
      ).minRisk
    ).toBe('High');
  });

  test('severe headache forces Medium', () => {
    expect(
      detectRedFlags(
        'severe headache for 2 days'
      ).minRisk
    ).toBe('Medium');
  });

  test('ordinary symptoms trigger nothing', () => {
    expect(
      detectRedFlags(
        'mild cough'
      ).minRisk
    ).toBeNull();
  });
});

describe('dashboard metrics', () => {
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

  test('last 6 months', () => {
    expect(
      getLastMonths(TODAY, 6).map(
        (month) => month.key
      )
    ).toEqual([
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
  });

  test('year rollover', () => {
    expect(
      getLastMonths(
        '2027-01-15',
        6
      ).map(
        (month) => month.key
      )[0]
    ).toBe('2026-08');
  });

  test('monthly visits exclude cancelled', () => {
    expect(
      buildMonthlyVisits(
        appointments,
        TODAY
      ).map(
        (month) => month.visits
      )
    ).toEqual([
      0,
      0,
      0,
      1,
      1,
      4,
    ]);
  });

  test('appointment counts', () => {
    expect(
      countAppointments(
        appointments,
        TODAY
      )
    ).toEqual({
      today: 1,
      upcoming: 1,
      completed: 4,
      cancelled: 1,
    });
  });

  test('pending analyses', () => {
    expect(
      countPendingAnalyses(
        appointments,
        insights
      )
    ).toBe(2);
  });

  test('critical alerts use only the latest insight per patient', () => {
    expect(
      countCriticalAlerts(
        insights
      )
    ).toBe(2);
  });
});
