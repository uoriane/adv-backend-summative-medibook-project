const pad = (value) => String(value).padStart(2, '0');

// Formats a Date as the 'YYYY-MM-DD HH:MM:SS' string MySQL DATETIME columns use.
function formatSqlDatetime(date) {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${day} ${time}`;
}

// Start of the given day and start of the next day, for range queries (>= start, < end).
function dayBounds(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return { start: formatSqlDatetime(start), end: formatSqlDatetime(end) };
}

module.exports = { formatSqlDatetime, dayBounds };
