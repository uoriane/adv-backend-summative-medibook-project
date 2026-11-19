const AppError = require('./AppError');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;
const MONEY_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;

function parseId(value) {
  if (!/^[1-9]\d*$/.test(String(value))) {
    throw new AppError(400, 'id must be a positive integer');
  }
  return Number(value);
}

function readString(body, field, maxLength, errors) {
  const value = body[field];
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${field} is required and must be a non-empty string`);
    return undefined;
  }
  if (value.trim().length > maxLength) {
    errors.push(`${field} must be at most ${maxLength} characters`);
    return undefined;
  }
  return value.trim();
}

function failIfInvalid(errors) {
  if (errors.length > 0) {
    throw new AppError(400, errors.join('; '));
  }
}

function validatePatient(body = {}) {
  const errors = [];
  const name = readString(body, 'name', 100, errors);
  const email = readString(body, 'email', 150, errors);
  const phone = readString(body, 'phone', 20, errors);

  if (email !== undefined && !EMAIL_PATTERN.test(email)) {
    errors.push('email must be a valid email address');
  }
  if (phone !== undefined && !PHONE_PATTERN.test(phone)) {
    errors.push('phone must be 7-20 characters: digits, spaces, +, -, ( )');
  }

  failIfInvalid(errors);
  return { name, email, phone };
}

function validateDoctor(body = {}) {
  const errors = [];
  const name = readString(body, 'name', 100, errors);
  const specialty = readString(body, 'specialty', 100, errors);
  const room = readString(body, 'room', 10, errors);

  const fee = body.consultation_fee;
  const feeIsValid =
    (typeof fee === 'number' || typeof fee === 'string') && MONEY_PATTERN.test(String(fee));
  if (!feeIsValid) {
    errors.push('consultation_fee must be a non-negative amount with at most 2 decimal places');
  }

  failIfInvalid(errors);
  return { name, specialty, consultation_fee: Number(fee), room };
}

module.exports = { parseId, validatePatient, validateDoctor };
