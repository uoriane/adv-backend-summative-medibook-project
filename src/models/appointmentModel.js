const pool = require('../config/db');
const withTransaction = require('../config/transaction');
const { MAX_APPOINTMENTS_PER_DAY } = require('../config/constants');
const { formatSqlDatetime, dayBounds } = require('../utils/datetime');

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT id, patient_id, doctor_id, appt_datetime, amount_paid, status,
            refund_amount, cancelled_at, booked_on
     FROM appointments WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function book({ patientId, doctorId, appointmentTime }) {
  const slot = formatSqlDatetime(appointmentTime);
  const { start, end } = dayBounds(appointmentTime);

  return withTransaction(async (connection) => {
    const [[doctor]] = await connection.query(
      'SELECT id, consultation_fee FROM doctors WHERE id = ? FOR UPDATE',
      [doctorId]
    );
    if (!doctor) return { outcome: 'DOCTOR_NOT_FOUND' };

    const [patients] = await connection.query('SELECT id FROM patients WHERE id = ?', [patientId]);
    if (patients.length === 0) return { outcome: 'PATIENT_NOT_FOUND' };

    const [[{ booked }]] = await connection.query(
      `SELECT COUNT(*) AS booked FROM appointments
       WHERE doctor_id = ? AND status = 'booked' AND appt_datetime >= ? AND appt_datetime < ?`,
      [doctorId, start, end]
    );
    if (booked >= MAX_APPOINTMENTS_PER_DAY) return { outcome: 'DAY_FULL' };

    try {
      const [result] = await connection.query(
        'INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid, active_slot) VALUES (?, ?, ?, ?, ?)',
        [patientId, doctorId, slot, doctor.consultation_fee, slot]
      );
      return { outcome: 'BOOKED', appointmentId: result.insertId };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return { outcome: 'SLOT_TAKEN' };
      throw err;
    }
  });
}

async function cancel(id, { cancelledAt, computeRefund }) {
  return withTransaction(async (connection) => {
    const [[appointment]] = await connection.query(
      `SELECT id, patient_id, doctor_id, appt_datetime, amount_paid, status
       FROM appointments WHERE id = ? FOR UPDATE`,
      [id]
    );
    if (!appointment) return { outcome: 'NOT_FOUND' };
    if (appointment.status === 'cancelled') return { outcome: 'ALREADY_CANCELLED' };

    const refundAmount = computeRefund(appointment);

    await connection.query(
      `UPDATE appointments
      SET status = 'cancelled', active_slot = NULL, refund_amount = ?, cancelled_at = ?
       WHERE id = ?`,
      [refundAmount, formatSqlDatetime(cancelledAt), id]
    );
    return { outcome: 'CANCELLED', appointment };
  });
}

module.exports = { findById, book, cancel };
