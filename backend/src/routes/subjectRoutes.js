
const express = require("express");

const {
    createSubject,
    getAllSubjects,
    getSemesterSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject,
} = require("../controllers/subjectController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All subject routes require authentication
router.use(protect);

// Add subject
router.post("/", createSubject);

// Get all logged-in user's subjects
router.get("/", getAllSubjects);

// Get subjects semester-wise
router.get("/semester/:semesterId", getSemesterSubjects);

// Get single subject
router.get("/:subjectId", getSubjectById);

// Update subject
router.patch("/:subjectId", updateSubject);

// Archive subject
router.delete("/:subjectId", deleteSubject);

module.exports = router;
