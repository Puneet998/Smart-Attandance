
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const verifyMailer = async () => {
    try {
        await transporter.verify();
        console.log("SMTP Server is ready to send emails.");
    } catch (error) {
        console.error("SMTP Configuration Error:", error.message);
    }
};

module.exports = {
    transporter,
    verifyMailer,
};
