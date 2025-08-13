// middleware/authMiddleware.js (already provided)
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const protect = async (req, res, next) => {
    // ... (rest of the protect logic)
};

const authorizeRoles = (...roles) => { // This is your roleMiddleware
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `User role ${req.user.role} is not authorized to access this route` });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };