
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dns = require("node:dns")
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const authRoutes = require("./routes/authRoutes");
const institutionRoutes = require("./routes/institutionRoutes");
const academicProgramRoutes = require("./routes/academicProgramRoutes");
const semesterRoutes = require("./routes/semesterRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const setupRoutes = require("./routes/setupRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const departmentRoutes = require("./routes/departmentRoutes");

const app = express();

// Allowed frontend origins
const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

// CORS configuration
app.use(
    cors({
        origin: function (origin, callback) {
            if (origin && allowedOrigins.includes(origin.replace(/\/$/, ""))) {
                return callback(null, true);
            }

            return callback(null, false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Public health API
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SmartAttend API is running",
    });
});

// CENTRAL WEBSITE ORIGIN PROTECTION
const verifyWebsiteOrigin = (req, res, next) => {
    const origin = req.get("Origin");

    if (!origin) {
        return res.status(403).json({
            success: false,
            message: "Direct API access is not allowed.",
        });
    }

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (!allowedOrigins.includes(normalizedOrigin)) {
        return res.status(403).json({
            success: false,
            message: "Access denied. Unauthorized website.",
        });
    }

    next();
};

// Apply protection to all other API routes
app.use("/api", verifyWebsiteOrigin);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/institutions", institutionRoutes);
app.use("/api/academic-programs", academicProgramRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/departments", departmentRoutes);

module.exports = app;
