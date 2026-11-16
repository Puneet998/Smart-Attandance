
const express = require("express");

const {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    updateDepartmentStatus,
    selectCurrentDepartment,
} = require("../controllers/departmentController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All department routes require authentication
router.use(protect);

// Create new department
router.post("/", createDepartment);

// Get all departments (course-wise)
router.get("/", getDepartments);

// Get single department
router.get("/:departmentId", getDepartmentById);

// Update department details
router.patch("/:departmentId", updateDepartment);

// Update department status
router.patch(
    "/:departmentId/status",
    updateDepartmentStatus
);

// Select current department
router.patch(
    "/:departmentId/select-current",
    selectCurrentDepartment
);

module.exports = router;
