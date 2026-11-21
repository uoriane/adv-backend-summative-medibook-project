const pool = require('../config/db');
const { MAX_APPOINTMENTS_PER_DAY, STATS_WINDOW_DAYS } = require('../config/constants');

async function doctorStatistics(doctorId) {
  const [[doctor]] = await pool.query(
    `SELECT d.id, d.name,
       COALESCE(SUM(CASE WHEN a.status = 'booked' THEN a.amount_paid ELSE 0 END), 0) AS revenue_collected,
       SUM(CASE WHEN a.status = 'booked' AND a.appt_datetime > NOW() THEN 1 ELSE 0 END) AS upcoming_count
     FROM doctors d
     LEFT JOIN appointments a ON a.doctor_id = d.id
     WHERE d.id = ?
     GROUP BY d.id, d.name`,
    [doctorId]
  );
  if (!doctor) return null;

  const [perDay] = await pool.query(
    `SELECT DATE(a.appt_datetime) AS date,
            COUNT(*) AS appointment_count
     FROM appointments a
     WHERE a.doctor_id = ? AND a.status = 'booked'
       AND a.appt_datetime >= CURDATE()
       AND a.appt_datetime < DATE_ADD(CURDATE(), INTERVAL ? DAY)
     GROUP BY DATE(a.appt_datetime)
     ORDER BY date`,
    [doctorId, STATS_WINDOW_DAYS]
  );

  const bookedInWindow = perDay.reduce((sum, row) => sum + Number(row.appointment_count), 0);
  const utilization = Math.round((bookedInWindow / (MAX_APPOINTMENTS_PER_DAY * STATS_WINDOW_DAYS)) * 10000) / 100;
  return { ...doctor, appointments_per_day: perDay, utilization_percent: utilization };
}

async function doctorsReport() {
  const [rows] = await pool.query(
    `SELECT d.id, d.name, d.specialty,
            COUNT(CASE WHEN a.status = 'booked' THEN 1 END) AS total_appointments,
            COALESCE(SUM(CASE WHEN a.status = 'booked' THEN a.amount_paid ELSE 0 END), 0) AS revenue_collected
     FROM doctors d
     LEFT JOIN appointments a ON a.doctor_id = d.id
     GROUP BY d.id, d.name, d.specialty
     ORDER BY d.id`
  );
  return rows;
}

async function busyDaysReport() {
  const [rows] = await pool.query(
    `SELECT d.id AS doctor_id, d.name AS doctor_name, DATE(a.appt_datetime) AS date,
            COUNT(*) AS booked_count
     FROM doctors d
     JOIN appointments a ON a.doctor_id = d.id AND a.status = 'booked'
     GROUP BY d.id, d.name, DATE(a.appt_datetime)
     HAVING COUNT(*) > ? * ?
     ORDER BY date, d.id`,
    [MAX_APPOINTMENTS_PER_DAY, 0.8]
  );
  return rows;
}

module.exports = { doctorStatistics, doctorsReport, busyDaysReport };
