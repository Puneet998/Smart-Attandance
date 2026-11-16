
const express = require("express");

const {
    createInstitution,
    getInstitutions,
    getCurrentInstitution,
    getInstitutionById,
    updateInstitution,
    updateInstitutionStatus,
    selectCurrentInstitution,
} = require("../controllers/institutionController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All institution routes require authentication
router.use(protect);

// Create institution
router.post("/", createInstitution);

// Get all institutions of logged-in student
router.get("/", getInstitutions);

// Get current institution
router.get("/current", getCurrentInstitution);

// Get single institution
router.get("/:institutionId", getInstitutionById);

// Update institution
router.patch("/:institutionId", updateInstitution);

// Update institution status
router.patch("/:institutionId/status", updateInstitutionStatus);

// Select current institution
router.patch(
    "/:institutionId/select-current",
    selectCurrentInstitution
);

module.exports = router;
