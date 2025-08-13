// utils/sendEmail.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (options) => {
    // Create a transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        // Optional: For self-signed certs or development where you don't have a valid SSL cert
        tls: {
            rejectUnauthorized: false
        }
    });

    // Setup email data
    const mailOptions = {
        from: `HealthLink Connect <${process.env.EMAIL_USER}>`, // sender address
        to: options.email, // list of receivers
        subject: options.subject, // Subject line
        html: options.message, // html body
    };

    // Send mail with defined transport object
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${options.email} with subject: ${options.subject}`);
    } catch (error) {
        console.error(`Error sending email to ${options.email}:`, error);
        // In a production app, you might want to log this error,
        // or re-queue the email to be sent later, or use a dedicated email service (SendGrid, Mailgun etc.)
    }
};

module.exports = sendEmail;