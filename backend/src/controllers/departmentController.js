
const Department = require("../models/Department");
const Institution = require("../models/Institution");
const AcademicProgram = require("../models/AcademicProgram");

// CREATE DEPARTMENT
exports.createDepartment = async (req, res) => {
    try {
        const {
            institution,
            academicProgram,
            departmentName,
            departmentCode,
            description,
        } = req.body;

        if (!institution || !academicProgram || !departmentName?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Institution, course and department name are required",
            });
        }

        // Verify institution belongs to logged-in student
        const institutionRecord = await Institution.findOne({
            _id: institution,
            student: req.user.id,
        });

        if (!institutionRecord) {
            return res.status(404).json({
                success: false,
                message: "Institution not found",
            });
        }

        // Verify course belongs to same student and institution
        const programRecord = await AcademicProgram.findOne({
            _id: academicProgram,
            student: req.user.id,
            institution: institutionRecord._id,
        });

        if (!programRecord) {
            return res.status(404).json({
                success: false,
                message: "Course not found in selected institution",
            });
        }

        const department = await Department.create({
            student: req.user.id,
            institution: institutionRecord._id,
            academicProgram: programRecord._id,
            departmentName: departmentName.trim(),
            departmentCode: departmentCode?.trim() || "",
            description: description?.trim() || "",
            status: "active",
            isCurrent: false,
        });

        return res.status(201).json({
            success: true,
            message: "Department created successfully",
            department,
        });
    } catch (error) {
        console.error("Create Department Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid institution or course ID",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create department",
        });
    }
};

// GET ALL DEPARTMENTS
exports.getDepartments = async (req, res) => {
    try {
        const { institution, academicProgram } = req.query;

        if (!academicProgram) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required",
            });
        }

        const programRecord = await AcademicProgram.findOne({
            _id: academicProgram,
            student: req.user.id,
            ...(institution ? { institution } : {}),
        });

        if (!programRecord) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        const departments = await Department.find({
            student: req.user.id,
            institution: programRecord.institution,
            academicProgram: programRecord._id,
        })
            .populate("institution", "institutionName universityName")
            .populate("academicProgram", "programName degree course")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            total: departments.length,
            departments,
        });
    } catch (error) {
        console.error("Get Departments Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid course or institution ID",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to fetch departments",
        });
    }
};

// GET SINGLE DEPARTMENT
exports.getDepartmentById = async (req, res) => {
    try {
        const department = await Department.findOne({
            _id: req.params.departmentId,
            student: req.user.id,
        })
            .populate("institution", "institutionName universityName")
            .populate("academicProgram", "programName degree course");

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found",
            });
        }

        return res.status(200).json({
            success: true,
            department,
        });
    } catch (error) {
        console.error("Get Department Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid department ID",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to fetch department",
        });
    }
};

// UPDATE DEPARTMENT
exports.updateDepartment = async (req, res) => {
    try {
        const allowedFields = [
            "departmentName",
            "departmentCode",
            "description",
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] =
                    typeof req.body[field] === "string"
                        ? req.body[field].trim()
                        : req.body[field];
            }
        }

        if (
            updates.departmentName !== undefined &&
            !updates.departmentName
        ) {
            return res.status(400).json({
                success: false,
                message: "Department name cannot be empty",
            });
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update",
            });
        }

        const department = await Department.findOneAndUpdate(
            {
                _id: req.params.departmentId,
                student: req.user.id,
            },
            { $set: updates },
            {
                new: true,
                runValidators: true,
            }
        )
            .populate("institution", "institutionName")
            .populate("academicProgram", "programName course");

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Department updated successfully",
            department,
        });
    } catch (error) {
        console.error("Update Department Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid department ID",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update department",
        });
    }
};

// UPDATE DEPARTMENT STATUS
exports.updateDepartmentStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid department status",
            });
        }

        const department = await Department.findOne({
            _id: req.params.departmentId,
            student: req.user.id,
        });

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found",
            });
        }

        department.status = status;

        if (status === "inactive") {
            department.isCurrent = false;
        }

        await department.save();

        return res.status(200).json({
            success: true,
            message: "Department status updated successfully",
            department,
        });
    } catch (error) {
        console.error("Update Department Status Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid department ID",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update department status",
        });
    }
};

// SELECT CURRENT DEPARTMENT
exports.selectCurrentDepartment = async (req, res) => {
    try {
        const { departmentId } = req.params;

        const department = await Department.findOne({
            _id: departmentId,
            student: req.user.id,
            status: "active",
        });

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Active department not found",
            });
        }

        // Verify institution is currently selected
        const institution = await Institution.findOne({
            _id: department.institution,
            student: req.user.id,
            isCurrent: true,
            status: "active",
        });

        if (!institution) {
            return res.status(400).json({
                success: false,
                message: "Select this department's institution first",
            });
        }

        // Verify course is currently selected
        const program = await AcademicProgram.findOne({
            _id: department.academicProgram,
            student: req.user.id,
            institution: department.institution,
            isCurrent: true,
            status: "active",
        });

        if (!program) {
            return res.status(400).json({
                success: false,
                message: "Select this department's course first",
            });
        }

        // Clear previously selected department
        await Department.updateMany(
            {
                student: req.user.id,
                isCurrent: true,
            },
            {
                $set: { isCurrent: false },
            }
        );

        department.isCurrent = true;
        await department.save();

        return res.status(200).json({
            success: true,
            message: "Current department selected successfully",
            department,
        });
    } catch (error) {
        console.error("Select Current Department Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid department ID",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to select current department",
        });
    }
};
