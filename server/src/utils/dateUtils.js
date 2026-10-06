const TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata';

// True only for a real calendar date written as YYYY-MM-DD
const isValidDateString = (value) => {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

// '2026-10-06' -> Date at midnight UTC
const toUtcDate = (dateString) =>
  new Date(`${dateString}T00:00:00.000Z`);

// Today's calendar date in configured timezone
const getTodayString = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

// Start and end of one calendar day
const getDayRange = (dateString) => {
  const start = toUtcDate(dateString);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
};

module.exports = {
  isValidDateString,
  toUtcDate,
  getTodayString,
  getDayRange,
};
