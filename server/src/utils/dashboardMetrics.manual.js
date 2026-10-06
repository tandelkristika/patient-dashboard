const toDateKey = (date) =>
  new Date(date).toISOString().slice(0, 10);

const toMonthKey = (date) =>
  new Date(date).toISOString().slice(0, 7);

// Last `count` months ending with today's month
const getLastMonths = (todayString, count = 6) => {
  const [year, month] = todayString.split('-').map(Number);
  const months = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(
      Date.UTC(year, month - 1 - i, 1)
    );

    months.push({
      key: date.toISOString().slice(0, 7),
      label: date.toLocaleString('en-US', {
        month: 'short',
        timeZone: 'UTC',
      }),
    });
  }

  return months;
};

// Monthly visits
const buildMonthlyVisits = (
  appointments,
  todayString,
  count = 6
) => {
  const months = getLastMonths(todayString, count);

  const totals = Object.fromEntries(
    months.map((m) => [m.key, 0])
  );

  appointments.forEach((appt) => {
    if (appt.status === 'Cancelled') return;

    const key = toMonthKey(appt.appointmentDate);

    if (key in totals) {
      totals[key] += 1;
    }
  });

  return months.map((m) => ({
    month: m.label,
    key: m.key,
    visits: totals[m.key],
  }));
};

// Appointment counts
const countAppointments = (
  appointments,
  todayString
) => {
  const result = {
    today: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  };

  appointments.forEach((appt) => {
    const day = toDateKey(appt.appointmentDate);

    if (appt.status === 'Scheduled') {
      if (day === todayString) {
        result.today += 1;
      } else if (day > todayString) {
        result.upcoming += 1;
      }
    } else if (appt.status === 'Completed') {
      result.completed += 1;
    } else if (appt.status === 'Cancelled') {
      result.cancelled += 1;
    }
  });

  return result;
};

// Completed appointments with symptoms but no AI insight
const countPendingAnalyses = (
  appointments,
  insights
) => {
  const analysedIds = new Set(
    insights
      .filter((i) => i.appointmentId)
      .map((i) => String(i.appointmentId))
  );

  return appointments.filter(
    (appt) =>
      appt.status === 'Completed' &&
      typeof appt.symptoms === 'string' &&
      appt.symptoms.trim().length > 0 &&
      !analysedIds.has(String(appt._id))
  ).length;
};

// Get newest insight for every patient
const getLatestInsightPerPatient = (insights) => {
  const latest = new Map();

  insights.forEach((insight) => {
    const key = String(insight.patientId);
    const current = latest.get(key);

    if (
      !current ||
      new Date(insight.generatedAt) >
        new Date(current.generatedAt)
    ) {
      latest.set(key, insight);
    }
  });

  return [...latest.values()];
};

// Count patients whose latest insight is High risk
const countCriticalAlerts = (insights) =>
  getLatestInsightPerPatient(insights)
    .filter((i) => i.riskLevel === 'High')
    .length;

module.exports = {
  getLastMonths,
  buildMonthlyVisits,
  countAppointments,
  countPendingAnalyses,
  getLatestInsightPerPatient,
  countCriticalAlerts,
};
