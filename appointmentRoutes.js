const express = require('express');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router();

router.post('/', appointmentController.book);
router.get('/:id', appointmentController.getOne);
router.delete('/:id', appointmentController.cancel);

module.exports = router;
