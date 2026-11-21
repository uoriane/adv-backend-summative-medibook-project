require('dotenv').config();
const { redis, connectRedis } = require('../config/redis');
const appointmentModel = require('../models/appointmentModel');
const { appendAudit } = require('../services/auditLogger');
const { promotionsKey, notificationsKey, slotKey, enqueueConfirmation } = require('../services/queueService');
const { formatSqlDatetime } = require('../utils/datetime');

async function processNotifications() {
  while (true) {
    const notification = await redis.brpop(notificationsKey, 1);
    if (!notification) continue;
    const job = JSON.parse(notification[1]);
    await appendAudit({
      event: 'notification',
      notificationType: job.type,
      appointmentId: job.appointmentId,
      patientId: job.patientId,
      message: 'Confirmation SMS/email queued notification processed',
    });
  }
}

async function processPromotions() {
  while (true) {
    const promotion = await redis.brpop(promotionsKey, 1);
    if (!promotion) continue;

    const job = JSON.parse(promotion[1]);
    const slot = job.slot || formatSqlDatetime(new Date(`${job.date}T09:00:00`));
    const key = slotKey(job.doctorId, slot);
    const raw = await redis.lpop(key);
    if (!raw) continue;

    const waitlisted = JSON.parse(raw);
    const appointmentTime = new Date(`${slot.slice(0, 10)}T${slot.slice(11, 16)}:00`);
    const result = await appointmentModel.book({
      patientId: waitlisted.patientId,
      doctorId: waitlisted.doctorId,
      appointmentTime,
    });

    if (result.outcome === 'BOOKED') {
      const appointment = await appointmentModel.findById(result.appointmentId);
      await appendAudit({ event: 'waitlist_promotion', appointmentId: appointment.id, patientId: waitlisted.patientId });
      await enqueueConfirmation(appointment);
    } else {
      await redis.lpush(key, raw);
      await appendAudit({
        event: 'waitlist_promotion_failed',
        patientId: waitlisted.patientId,
        doctorId: waitlisted.doctorId,
        outcome: result.outcome,
      });
    }
  }
}

async function start() {
  await connectRedis();
  console.log('MediBook worker running');
  await Promise.all([processPromotions(), processNotifications()]);
}

start().catch((error) => {
  console.error('Worker failed:', error);
  process.exit(1);
});
