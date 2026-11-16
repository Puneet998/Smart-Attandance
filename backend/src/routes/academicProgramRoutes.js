
const express = require("express");

const {
    createAcademicProgram,
    getAcademicPrograms,
    getAcademicProgramById,
    updateAcademicProgram,
    updateAcademicProgramStatus,
    selectCurrentAcademicProgram,
} = require("../controllers/academicProgramController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All academic program routes require authentication
router.use(protect);

// Create new academic program
router.post("/", createAcademicProgram);

// Get all academic programs
router.get("/", getAcademicPrograms);

// Get single academic program
router.get("/:programId", getAcademicProgramById);

// Update academic program details
router.patch("/:programId", updateAcademicProgram);

// Update academic program status
router.patch("/:programId/status", updateAcademicProgramStatus);

// Select current academic program
router.patch("/:programId/select-current", selectCurrentAcademicProgram);

module.exports = router;
