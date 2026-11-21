const express = require('express');
const doctorModel = require('../models/doctorModel');
const createCrudController = require('../controllers/crudController');
const { validateDoctor } = require('../utils/validation');

const router = express.Router();
const controller = createCrudController({
  model: doctorModel,
  validate: validateDoctor,
  label: 'Doctor',
  basePath: '/doctors',
});

router.route('/').get(controller.list).post(controller.create);
router.route('/:id').get(controller.getOne).put(controller.update).delete(controller.remove);

module.exports = router;
