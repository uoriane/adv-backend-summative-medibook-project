const { REFUND } = require('../config/constants');

const MS_PER_HOUR = 60 * 60 * 1000;

function refundRate(hoursNotice) {
  if (hoursNotice > REFUND.FULL_NOTICE_HOURS) return REFUND.FULL_RATE;
  if (hoursNotice >= REFUND.PARTIAL_NOTICE_HOURS) return REFUND.PARTIAL_RATE;
  return REFUND.NO_RATE;
}

// Policy: more than 48h => 100%; 24h up to and including 48h => 50%; under 24h => 0%.
// So exactly 48h and exactly 24h both fall in the 50% tier.
function calculateRefund(amountPaid, appointmentTime, now = new Date()) {
  const hoursNotice = (appointmentTime - now) / MS_PER_HOUR;
  return Math.round(amountPaid * refundRate(hoursNotice) * 100) / 100;
}

module.exports = { calculateRefund };
