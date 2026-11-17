
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const dns = require("node:dns");
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

// Only allowed frontend origins
const allowedOrigins = [
    "http://localhost:5173",
    "https://attendance.puneetdev.xyz",
];

// Normalize origin
const normalizeOrigin = (origin = "") => {
    return origin.trim().replace(/\/+$/, "");
};

// Check allowed origin
const isAllowedOrigin = (origin) => {
    return allowedOrigins.includes(normalizeOrigin(origin));
};

// CORS configuration
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || isAllowedOrigin(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-CSRF-Token",
        ],
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

    if (!isAllowedOrigin(origin)) {
        return res.status(403).json({
            success: false,
            message: "Access denied. Unauthorized website.",
        });
    }

    next();
};

app.get("/", (req, res) => {
    res.json({ "status": 201, "message": "server is running" })
})
// Apply protection to all API routes
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
