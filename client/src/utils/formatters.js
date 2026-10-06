// Appointment dates are calendar dates stored as midnight UTC,
// so always format them in UTC.
export const formatDate = (value) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

// '14:30' -> '2:30 PM'
export const formatTimeSlot = (slot) => {
  if (
    typeof slot !== 'string' ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot)
  ) {
    return '-';
  }

  const [hours, minutes] = slot.split(':').map(Number);

  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

// 'Jane Doe' -> 'JD'
export const getInitials = (name) => {
  if (typeof name !== 'string') return '?';

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '?';

  const first = parts[0][0];
  const last = parts.length > 1
    ? parts[parts.length - 1][0]
    : '';

  return (first + last).toUpperCase();
};

// Shortens long text for table/list cells.
export const truncate = (text, max = 60) => {
  if (typeof text !== 'string') return '';

  return text.length > max
    ? `${text.slice(0, max - 1).trimEnd()}…`
    : text;
};
