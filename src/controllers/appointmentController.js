const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const appointmentModel = require('../models/appointmentModel');
const { parseId, validateBookingInput } = require('../utils/validation');
const { validateSlot, parseLocalDatetime } = require('../utils/slot');
const { calculateRefund } = require('../utils/refund');
const { appendAudit } = require('../services/auditLogger');
const { addToWaitlist, notifyPromotion, enqueueConfirmation } = require('../services/queueService');
const { formatSqlDatetime, dayBounds } = require('../utils/datetime');

const BOOKING_FAILURES = {
  DOCTOR_NOT_FOUND: [404, 'Doctor not found'],
  PATIENT_NOT_FOUND: [404, 'Patient not found'],
  DAY_FULL: [409, 'The doctor is fully booked on that day'],
  SLOT_TAKEN: [409, 'That slot is already booked'],
};

const CANCEL_FAILURES = {
  NOT_FOUND: [404, 'Appointment not found'],
  ALREADY_CANCELLED: [409, 'Appointment is already cancelled'],
};

function failWith(failures, outcome) {
  const [status, message] = failures[outcome];
  throw new AppError(status, message);
}

const book = asyncHandler(async (req, res) => {
  const { patientId, doctorId, apptDatetime } = validateBookingInput(req.body);

  const slot = validateSlot(apptDatetime);
  if (!slot.valid) throw new AppError(slot.status, slot.message);

  const result = await appointmentModel.book({
    patientId,
    doctorId,
    appointmentTime: slot.date,
  });
  if (result.outcome !== 'BOOKED') {
    if (result.outcome === 'DAY_FULL' || result.outcome === 'SLOT_TAKEN') {
      try {
        await addToWaitlist({
          patientId,
          doctorId,
          appointmentTime: formatSqlDatetime(slot.date),
          waitForDay: result.outcome === 'DAY_FULL',
        });
      } catch (error) {
        console.error('Could not add patient to waitlist:', error.message);
      }
    }
    failWith(BOOKING_FAILURES, result.outcome);
  }

  const appointment = await appointmentModel.findById(result.appointmentId);
  await appendAudit({ event: 'booking', appointmentId: appointment.id, patientId: patientId, doctorId: doctorId });
  try {
    await enqueueConfirmation(appointment);
  } catch (error) {
    console.error('Could not enqueue confirmation:', error.message);
  }
  res.status(201).location(`/appointments/${appointment.id}`).json(appointment);
});

const joinWaitlist = asyncHandler(async (req, res) => {
  const { patientId, doctorId, apptDatetime } = validateBookingInput(req.body);
  const slot = validateSlot(apptDatetime);
  if (!slot.valid) throw new AppError(slot.status, slot.message);

  let key;
  try {
    key = await addToWaitlist({
      patientId,
      doctorId,
      appointmentTime: formatSqlDatetime(slot.date),
    });
  } catch (error) {
    throw new AppError(503, 'Waitlist is temporarily unavailable');
  }
  res.status(201).json({ message: 'Added to the waitlist', waitlistKey: key });
});

const getOne = asyncHandler(async (req, res) => {
  const appointment = await appointmentModel.findById(parseId(req.params.id));
  if (!appointment) throw new AppError(404, 'Appointment not found');
  res.json(appointment);
});

// DELETE cancels the appointment (soft delete): the row stays for refund history.
const cancel = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const now = new Date();

  const result = await appointmentModel.cancel(id, {
    cancelledAt: now,
    computeRefund: (appointment) => {
      const appointmentTime = parseLocalDatetime(appointment.appt_datetime);
      if (appointmentTime <= now) {
        throw new AppError(422, 'Appointments that have already started cannot be cancelled');
      }
      return calculateRefund(appointment.amount_paid, appointmentTime, now);
    },
  });
  if (result.outcome !== 'CANCELLED') failWith(CANCEL_FAILURES, result.outcome);

  const appointment = await appointmentModel.findById(id);
  await appendAudit({
    event: 'cancellation',
    appointmentId: id,
    refundAmount: appointment.refund_amount,
  });
  const bounds = dayBounds(parseLocalDatetime(appointment.appt_datetime));
  try {
    await notifyPromotion({
      doctorId: result.appointment.doctor_id,
      slot: formatSqlDatetime(parseLocalDatetime(appointment.appt_datetime)),
      date: bounds.start.slice(0, 10),
    });
  } catch (error) {
    console.error('Could not notify waitlist worker:', error.message);
  }
  res.json(appointment);
});

module.exports = { book, getOne, cancel, joinWaitlist };
