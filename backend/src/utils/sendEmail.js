
const { transporter } = require("../config/mailer");

const sendEmail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"SmartAttend" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });

        console.log("Email sent successfully:", info.messageId);

        return info;
    } catch (error) {
        console.error("Email Sending Error:", error);
        throw new Error("Unable to send email");
    }
};

module.exports = sendEmail;
