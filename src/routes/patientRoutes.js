const express = require('express');
const patientModel = require('../models/patientModel');
const createCrudController = require('../controllers/crudController');
const { validatePatient } = require('../utils/validation');

const router = express.Router();
const controller = createCrudController({
  model: patientModel,
  validate: validatePatient,
  label: 'Patient',
  basePath: '/patients',
});

router.route('/').get(controller.list).post(controller.create);
router.route('/:id').get(controller.getOne).put(controller.update).delete(controller.remove);

module.exports = router;
