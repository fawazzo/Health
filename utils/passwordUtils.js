// utils/passwordUtils.js
const bcrypt = require('bcryptjs');

const passwordUtils = {
    /**
     * Hashes a plain-text password.
     * @param {string} password The plain-text password.
     * @returns {Promise<string>} The hashed password.
     */
    hashPassword: async (password) => {
        const salt = await bcrypt.genSalt(10); // Generate a salt with 10 rounds
        return await bcrypt.hash(password, salt);
    },

    /**
     * Compares a plain-text password with a hashed password.
     * @param {string} plainPassword The plain-text password.
     * @param {string} hashedPassword The hashed password to compare against.
     * @returns {Promise<boolean>} True if passwords match, false otherwise.
     */
    comparePasswords: async (plainPassword, hashedPassword) => {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
};

module.exports = passwordUtils;