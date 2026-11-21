const { validateSlot, parseLocalDatetime } = require('./slot');

const NOW = new Date(2026, 11, 1, 12, 0, 0);

describe('validateSlot', () => {
  test('accepts a future slot on a 30-minute boundary inside working hours', () => {
    const result = validateSlot('2026-12-10 10:30', NOW);
    expect(result.valid).toBe(true);
    expect(result.date.getHours()).toBe(10);
  });

  test('accepts the first slot of the day (09:00) and the last (16:30)', () => {
    expect(validateSlot('2026-12-10 09:00', NOW).valid).toBe(true);
    expect(validateSlot('2026-12-10 16:30', NOW).valid).toBe(true);
  });

  test('rejects 17:00 exactly with 422 because the clinic is closing', () => {
    expect(validateSlot('2026-12-10 17:00', NOW)).toMatchObject({ valid: false, status: 422 });
  });

  test('rejects a slot before opening time with 422', () => {
    expect(validateSlot('2026-12-10 08:30', NOW)).toMatchObject({ valid: false, status: 422 });
  });

  test('rejects 09:15 (not on a 30-minute boundary) with 422', () => {
    expect(validateSlot('2026-12-10 09:15', NOW)).toMatchObject({ valid: false, status: 422 });
  });

  test('rejects a slot with non-zero seconds with 422', () => {
    expect(validateSlot('2026-12-10 10:00:30', NOW)).toMatchObject({ valid: false, status: 422 });
  });

  test('rejects a slot in the past and a slot exactly now with 422', () => {
    expect(validateSlot('2026-11-30 10:00', NOW)).toMatchObject({ valid: false, status: 422 });
    expect(validateSlot('2026-12-01 12:00', new Date(2026, 11, 1, 12, 0, 0))).toMatchObject({
      valid: false,
      status: 422,
    });
  });

  test.each(['tomorrow', '', '2026-12-10', '2026-02-30 10:00', '2026-12-10 25:00'])(
    'rejects malformed input %p with 400',
    (input) => {
      expect(validateSlot(input, NOW)).toMatchObject({ valid: false, status: 400 });
    }
  );

  test('rejects non-string input with 400', () => {
    expect(validateSlot(undefined, NOW)).toMatchObject({ valid: false, status: 400 });
    expect(validateSlot(12345, NOW)).toMatchObject({ valid: false, status: 400 });
  });
});

describe('parseLocalDatetime', () => {
  test('accepts a T separator and optional seconds', () => {
    expect(parseLocalDatetime('2026-12-10T10:30:00')).toEqual(new Date(2026, 11, 10, 10, 30, 0));
  });
});
