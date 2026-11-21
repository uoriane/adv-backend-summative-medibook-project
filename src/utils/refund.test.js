const { calculateRefund } = require('./refund');

const HOUR = 60 * 60 * 1000;
const NOW = new Date(2026, 11, 1, 12, 0, 0);
const appointmentIn = (hours) => new Date(NOW.getTime() + hours * HOUR);

describe('calculateRefund', () => {
  test('gives a full refund with more than 48 hours notice', () => {
    expect(calculateRefund(150, appointmentIn(72), NOW)).toBe(150);
  });

  test('gives a full refund just over the 48 hour boundary', () => {
    expect(calculateRefund(150, appointmentIn(48 + 1 / 60), NOW)).toBe(150);
  });

  test('gives a 50% refund at exactly 48 hours (boundary belongs to the 50% tier)', () => {
    expect(calculateRefund(150, appointmentIn(48), NOW)).toBe(75);
  });

  test('gives a 50% refund between 24 and 48 hours', () => {
    expect(calculateRefund(150, appointmentIn(36), NOW)).toBe(75);
  });

  test('gives a 50% refund at exactly 24 hours (boundary belongs to the 50% tier)', () => {
    expect(calculateRefund(150, appointmentIn(24), NOW)).toBe(75);
  });

  test('gives no refund just under 24 hours', () => {
    expect(calculateRefund(150, appointmentIn(24 - 1 / 60), NOW)).toBe(0);
  });

  test('gives no refund for an appointment that has already started', () => {
    expect(calculateRefund(150, appointmentIn(-2), NOW)).toBe(0);
  });
});
