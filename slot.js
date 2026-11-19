const { SLOT_MINUTES, WORKING_HOURS } = require('../config/constants');

const DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;

// Parses 'YYYY-MM-DD HH:MM[:SS]' (or with a 'T') as clinic-local time.
// Returns null for malformed input or dates that do not exist (e.g. 2026-02-30).
function parseLocalDatetime(value) {
  if (typeof value !== 'string') return null;
  const match = DATETIME_PATTERN.exec(value.trim());
  if (!match) return null;

  const [year, month, day, hour, minute, second] = match
    .slice(1)
    .map((part) => (part === undefined ? 0 : Number(part)));
  const date = new Date(year, month - 1, day, hour, minute, second);

  const isRealDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute &&
    date.getSeconds() === second;
  return isRealDate ? date : null;
}

function reject(status, message) {
  return { valid: false, status, message };
}

// Malformed input => 400. Well-formed but breaks a booking rule => 422.
function validateSlot(value, now = new Date()) {
  const date = parseLocalDatetime(value);
  if (!date) {
    return reject(400, 'appt_datetime must be a valid date-time, e.g. 2026-12-10 09:30');
  }

  const minutesIntoDay = date.getHours() * 60 + date.getMinutes();
  if (date.getSeconds() !== 0 || minutesIntoDay % SLOT_MINUTES !== 0) {
    return reject(422, `Appointments must start on a ${SLOT_MINUTES}-minute boundary`);
  }

  const opensAt = WORKING_HOURS.START * 60;
  const closesAt = WORKING_HOURS.END * 60;
  if (minutesIntoDay < opensAt || minutesIntoDay + SLOT_MINUTES > closesAt) {
    return reject(
      422,
      `Appointments must fall within working hours (${WORKING_HOURS.START}:00-${WORKING_HOURS.END}:00)`
    );
  }

  if (date <= now) {
    return reject(422, 'Appointments can only be booked in the future');
  }

  return { valid: true, date };
}

module.exports = { parseLocalDatetime, validateSlot };
