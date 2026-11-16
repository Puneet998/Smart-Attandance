
const express = require("express");

const {
    createTimetable,
    getTimetableBySemester,
    updateTimetable,
    deleteTimetable,
} = require("../controllers/timetableController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * All timetable routes require authentication.
 */
router.use(protect);

/**
 * @route   POST /api/timetables
 * @desc    Create a lecture or break entry
 * @access  Private
 */
router.post("/", createTimetable);

/**
 * @route   GET /api/timetables/semester/:semesterId
 * @desc    Get all timetable entries for a semester
 * @access  Private
 */
router.get("/semester/:semesterId", getTimetableBySemester);

/**
 * @route   PATCH /api/timetables/:timetableId
 * @desc    Update a lecture or break entry
 * @access  Private
 */
router.patch("/:timetableId", updateTimetable);

/**
 * @route   DELETE /api/timetables/:timetableId
 * @desc    Archive a timetable entry
 * @access  Private
 */
router.delete("/:timetableId", deleteTimetable);

module.exports = router;
