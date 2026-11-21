const { formatSqlDatetime, dayBounds } = require('../src/utils/datetime');

describe('datetime helpers', () => {
  test('formatSqlDatetime pads every part', () => {
    expect(formatSqlDatetime(new Date(2026, 0, 5, 9, 5, 3))).toBe('2026-01-05 09:05:03');
  });

  test('dayBounds returns midnight of the day and of the next day', () => {
    expect(dayBounds(new Date(2026, 11, 31, 14, 30))).toEqual({
      start: '2026-12-31 00:00:00',
      end: '2027-01-01 00:00:00',
    });
  });
});
