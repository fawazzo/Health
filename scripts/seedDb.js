// scripts/seedDb.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Specialty = require('../models/Specialty');
const Pharmacy = require('../models/Pharmacy');
// Add other models if you want to seed more data like appointments, reviews, etc.

dotenv.config(); // Load environment variables from .env

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(`Error connecting to MongoDB: ${err.message}`);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        await connectDB(); // Ensure DB connection before seeding

        // Clear existing data (optional, but good for fresh seeds)
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Hospital.deleteMany({});
        await Specialty.deleteMany({});
        await Pharmacy.deleteMany({});
        console.log('Existing data cleared.');

        // --- 1. Seed Specialties ---
        console.log('Seeding Specialties...');
        const specialties = await Specialty.insertMany([
            { name: 'Cardiology', description: 'Deals with disorders of the heart and the cardiovascular system.' },
            { name: 'Pediatrics', description: 'Specializes in the health and medical care of infants, children, and adolescents.' },
            { name: 'Dermatology', description: 'Focuses on diseases of the skin, hair, and nails.' },
            { name: 'Orthopedics', description: 'Deals with the musculoskeletal system.' },
            { name: 'Neurology', description: 'Deals with disorders of the nervous system.' },
            { name: 'General Practice', description: 'Provides primary healthcare for all ages.' }
        ]);
        console.log(`${specialties.length} Specialties seeded.`);

        // --- 2. Seed Hospitals ---
        console.log('Seeding Hospitals...');
        const hospitals = await Hospital.insertMany([
            {
                name: 'City General Hospital',
                address: '123 Main St',
                city: 'Metropolis',
                state: 'NY',
                zipCode: '10001',
                phoneNumber: '555-123-4567',
                website: 'http://citygeneral.com',
                description: 'A leading healthcare provider with state-of-the-art facilities.',
                services: ['Emergency Care', 'Surgery', 'Maternity'],
                departments: ['Cardiology', 'Pediatrics', 'Orthopedics']
            },
            {
                name: 'Greenwood Medical Center',
                address: '456 Oak Ave',
                city: 'Metropolis',
                state: 'NY',
                zipCode: '10002',
                phoneNumber: '555-987-6543',
                website: 'http://greenwoodmedical.com',
                description: 'Focused on holistic and patient-centered care.',
                services: ['Primary Care', 'Specialty Consultations', 'Physical Therapy'],
                departments: ['General Practice', 'Neurology']
            },
            {
                name: 'Coastal Care Hospital',
                address: '789 Beach Blvd',
                city: 'Coastal City',
                state: 'CA',
                zipCode: '90210',
                phoneNumber: '555-111-2222',
                website: 'http://coastalcare.com',
                description: 'Specializing in coastal region health issues.',
                services: ['Emergency Care', 'Rehabilitation', 'Diagnostic Imaging'],
                departments: ['Dermatology', 'Orthopedics']
            }
        ]);
        console.log(`${hospitals.length} Hospitals seeded.`);

        // --- 3. Seed Pharmacies ---
        console.log('Seeding Pharmacies...');
        const pharmacies = await Pharmacy.insertMany([
            {
                name: 'Central Pharmacy',
                address: '100 Market St',
                city: 'Metropolis',
                state: 'NY',
                zipCode: '10001',
                phoneNumber: '555-200-3000',
                website: 'http://centralpharmacy.com',
                location: { type: 'Point', coordinates: [-73.987, 40.758] }, // Example coordinates
                services: ['Prescription Filling', 'Vaccinations', 'Medication Counseling']
            },
            {
                name: 'Quick Meds Pharmacy',
                address: '200 Elm St',
                city: 'Metropolis',
                state: 'NY',
                zipCode: '10002',
                phoneNumber: '555-400-5000',
                website: 'http://quickmeds.com',
                location: { type: 'Point', coordinates: [-73.999, 40.765] },
                services: ['Drive-Thru', 'Delivery', 'Over-the-Counter Sales']
            }
        ]);
        console.log(`${pharmacies.length} Pharmacies seeded.`);

        // --- 4. Seed Users (Admin, Patient, Doctor, Hospital Admin, Pharmacy Admin) ---
        console.log('Seeding Users...');

        // Admin User
        const adminUser = await User.create({
            email: 'admin@example.com',
            password: 'password123', // Will be hashed by pre-save hook
            role: 'admin',
            profile: {
                firstName: 'Admin',
                lastName: 'User'
            }
        });
        console.log('Admin User seeded.');

        // Patient User
        const patientUser = await User.create({
            email: 'patient@example.com',
            password: 'password123',
            role: 'patient',
            profile: {
                firstName: 'Alice',
                lastName: 'Smith',
                dateOfBirth: '1990-05-15',
                phoneNumber: '1234567890'
            }
        });
        console.log('Patient User seeded.');

        // Doctor User
        const doctorUser = await User.create({
            email: 'doctor@example.com',
            password: 'password123',
            role: 'doctor',
            profile: {
                firstName: 'Dr. John',
                lastName: 'Doe',
                medicalLicenseNumber: 'MD123456',
                specialties: [specialties[0].name, specialties[3].name], // Cardiology, Orthopedics
                hospitalAffiliations: [hospitals[0]._id, hospitals[2]._id], // City General, Coastal Care
                phoneNumber: '1112223333',
                gender: 'Male',
                bio: 'Experienced cardiologist and orthopedic surgeon.',
                averageRating: 4.5, // Initial dummy value
                numReviews: 2 // Initial dummy value
            }
        });
        console.log('Doctor User seeded.');

        // Hospital Admin User (managing City General Hospital)
        const hospitalAdminUser = await User.create({
            email: 'hospitaladmin@example.com',
            password: 'password123',
            role: 'hospital_admin',
            profile: {
                firstName: 'Sarah',
                lastName: 'Connor',
                managedHospitalId: hospitals[0]._id // City General Hospital
            }
        });
        console.log('Hospital Admin User seeded.');

        // Pharmacy Admin User (managing Central Pharmacy)
        const pharmacyAdminUser = await User.create({
            email: 'pharmacyadmin@example.com',
            password: 'password123',
            role: 'pharmacy_admin',
            profile: {
                firstName: 'Mike',
                lastName: 'Ross',
                managedPharmacyId: pharmacies[0]._id // Central Pharmacy
            }
        });
        console.log('Pharmacy Admin User seeded.');


        console.log('All seeding complete!');
    } catch (error) {
        console.error(`Seeding failed: ${error.message}`);
        console.error(error); // Log full error for debugging
    } finally {
        mongoose.disconnect(); // Disconnect from DB after seeding
    }
};

seedData();