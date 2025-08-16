// app.js
const express = require('express');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const specialtyRoutes = require('./routes/specialtyRoutes');
const doctorRoutes = require('./routes/doctorRoutes'); // This will handle doctor-specific actions, availability
const appointmentRoutes = require('./routes/appointmentRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');


const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Body parser for JSON
app.use(morgan('dev')); // HTTP request logger

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/doctors', doctorRoutes); // For doctor-specific public actions/searches
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/medicalrecords', medicalRecordRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pharmacies', pharmacyRoutes);


// Health check endpoint
app.get('/', (req, res) => {
    res.send('HealthLink Connect API is running!');
});

// Centralized Error Handling Middleware (must be last middleware)
app.use(errorHandler);

module.exports = app;