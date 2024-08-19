import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { asyncHandler } from './asyncHandler.js';
dotenv.config();

const sendMail =asyncHandler( async ({ from, to, subject, text }) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.MY_MAIL,
                pass: process.env.MY_PASSWORD,
            },
        });

        const mailOptions = {
            from,
            to,
            subject,
            text,
        };

        console.log('Sending email with options:', mailOptions);

        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent:', info.response);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
});

export default sendMail;


