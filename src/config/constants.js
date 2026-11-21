module.exports = Object.freeze({
  MAX_APPOINTMENTS_PER_DAY: 12,
  SLOT_MINUTES: 30,
  WORKING_HOURS: { START: 9, END: 17 },

  // Refund policy: >48h => 100%, 24h to 48h inclusive => 50%, <24h => 0%.
  REFUND: {
    FULL_NOTICE_HOURS: 48,
    PARTIAL_NOTICE_HOURS: 24,
    FULL_RATE: 1,
    PARTIAL_RATE: 0.5,
    NO_RATE: 0,
  },

  BUSY_DAY_THRESHOLD: 0.8,
  STATS_WINDOW_DAYS: 7,
});
