const STATUSES = ['Scheduled', 'Completed', 'Cancelled'];

const ALLOWED_TRANSITIONS = {
  Scheduled: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

const canTransition = (from, to) =>
  from === to ||
  (ALLOWED_TRANSITIONS[from] || []).includes(to);

module.exports = {
  STATUSES,
  canTransition,
};
