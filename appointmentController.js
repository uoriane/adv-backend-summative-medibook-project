const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const appointmentModel = require('../models/appointmentModel');
const { parseId, validateBookingInput } = require('../utils/validation');
const { validateSlot, parseLocalDatetime } = require('../utils/slot');
const { calculateRefund } = require('../utils/refund');

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
  if (result.outcome !== 'BOOKED') failWith(BOOKING_FAILURES, result.outcome);

  const appointment = await appointmentModel.findById(result.appointmentId);
  res.status(201).location(`/appointments/${appointment.id}`).json(appointment);
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

  res.json(await appointmentModel.findById(id));
});

module.exports = { book, getOne, cancel };
