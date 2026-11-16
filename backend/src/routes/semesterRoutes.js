
const express = require("express");

const {
    generateSemesters,
    getProgramSemesters,
    getSemesterById,
    startSemester,
    completeSemester,
    getCurrentSemester,
    getSemesterHistory,
} = require("../controllers/semesterController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Automatically generate all semesters
router.post("/generate", generateSemesters);

// Get all semesters of a program
router.get("/program/:programId", getProgramSemesters);

// Get current semester
router.get("/program/:programId/current", getCurrentSemester);

// Get completed semester history
router.get("/program/:programId/history", getSemesterHistory);

// Start / select current semester
router.patch("/:semesterId/start", startSemester);

// Complete current semester
router.patch("/:semesterId/complete", completeSemester);

// Get single semester
router.get("/:semesterId", getSemesterById);

module.exports = router;
