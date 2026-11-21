const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const reportModel = require('../models/reportModel');
const { parseId } = require('../utils/validation');

const router = express.Router();

router.get('/doctors/:id/statistics', asyncHandler(async (req, res) => {
  const stats = await reportModel.doctorStatistics(parseId(req.params.id));
  if (!stats) throw new AppError(404, 'Doctor not found');
  res.json(stats);
}));

router.get('/reports/doctors', asyncHandler(async (_req, res) => {
  res.json(await reportModel.doctorsReport());
}));

router.get('/reports/busy-days', asyncHandler(async (_req, res) => {
  res.json(await reportModel.busyDaysReport());
}));

module.exports = router;
