
const express = require("express");

const {
  markAttendance,
  markBulkAttendance,
  getSemesterAttendance,
  updateAttendance,
  getAttendanceSummary,
} = require("../controllers/attendanceController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Individual attendance
router.post("/", markAttendance);

// Bulk attendance
router.post("/bulk", markBulkAttendance);

// Attendance summary
router.get("/summary/:semesterId", getAttendanceSummary);

// Semester attendance records
router.get("/semester/:semesterId", getSemesterAttendance);

// Update attendance
router.patch("/:attendanceId", updateAttendance);

module.exports = router;
