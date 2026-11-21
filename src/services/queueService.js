const { connectRedis } = require('../config/redis');

const slotKey = (doctorId, slot) => `medibook:waitlist:slot:${doctorId}:${slot}`;
const dayKey = (doctorId, date) => `medibook:waitlist:day:${doctorId}:${date}`;
const promotionsKey = 'medibook:promotions';
const notificationsKey = 'medibook:notifications';

async function addToWaitlist({ patientId, doctorId, appointmentTime }) {
  const redis = await connectRedis();
  const key = slotKey(doctorId, appointmentTime);
  await redis.rpush(key, JSON.stringify({ patientId, doctorId, appointmentTime }));
  return key;
}

async function notifyPromotion({ doctorId, slot, date }) {
  const redis = await connectRedis();
  await redis.rpush(promotionsKey, JSON.stringify({
    doctorId,
    slot,
    date,
  }));
}

async function enqueueConfirmation(appointment) {
  const redis = await connectRedis();
  await redis.rpush(notificationsKey, JSON.stringify({
    type: 'confirmation',
    appointmentId: appointment.id,
    patientId: appointment.patient_id,
  }));
}

module.exports = { slotKey, dayKey, promotionsKey, notificationsKey, addToWaitlist, notifyPromotion, enqueueConfirmation };
