const express = require('express');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

app.use('/patients', patientRoutes);
app.use('/doctors', doctorRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
