
const express = require("express");

const {
    getSemesterReport,
} = require("../controllers/reportController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Authentication required
router.use(protect);

// Complete semester attendance report
router.get(
    "/semester/:semesterId",
    getSemesterReport
);

module.exports = router;
