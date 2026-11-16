
require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");
const { verifyMailer } = require("./src/config/mailer");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        // Verify Gmail SMTP configuration
        await verifyMailer();

        app.listen(PORT, () => {
            console.log(`SmartAttend Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
};

startServer();
