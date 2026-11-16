
const mongoose = require("mongoose");

const Institution = require("../models/Institution");
const AcademicProgram = require("../models/AcademicProgram");

const allowedStatuses = [
    "active",
    "completed",
    "transferred",
    "withdrawn",
];

const allowedUpdateFields = [
    "institutionName",
    "institutionType",
    "universityName",
    "campus",
    "city",
    "state",
    "country",
    "startDate",
    "endDate",
];

const getStudentId = (req) => req.user?._id || req.user?.id;

const isValidId = (id) => mongoose.isValidObjectId(id);

// CREATE INSTITUTION
exports.createInstitution = async (req, res) => {
    try {
        const studentId = getStudentId(req);

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const {
            institutionName,
            institutionType,
            universityName,
            campus,
            city,
            state,
            country,
            startDate,
        } = req.body;

        if (
            typeof institutionName !== "string" ||
            !institutionName.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Institution name is required",
            });
        }

        // Only the first institution becomes current automatically
        const existingInstitution = await Institution.exists({
            student: studentId,
            isCurrent: true,
            status: "active",
        });

        const institution = await Institution.create({
            student: studentId,
            institutionName: institutionName.trim(),
            institutionType,
            universityName,
            campus,
            city,
            state,
            country,
            startDate,
            status: "active",
            isCurrent: !existingInstitution,
        });

        return res.status(201).json({
            success: true,
            message: "Institution added successfully",
            institution,
        });
    } catch (error) {
        console.error("Create Institution Error:", error);

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create institution",
        });
    }
};

// GET ALL STUDENT INSTITUTIONS
exports.getInstitutions = async (req, res) => {
    try {
        const studentId = getStudentId(req);

        const institutions = await Institution.find({
            student: studentId,
        }).sort({
            isCurrent: -1,
            createdAt: -1,
        });

        return res.status(200).json({
            success: true,
            total: institutions.length,
            institutions,
        });
    } catch (error) {
        console.error("Get Institutions Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch institutions",
        });
    }
};

// GET CURRENT INSTITUTION
exports.getCurrentInstitution = async (req, res) => {
    try {
        const studentId = getStudentId(req);

        const institution = await Institution.findOne({
            student: studentId,
            isCurrent: true,
            status: "active",
        });

        return res.status(200).json({
            success: true,
            institution,
        });
    } catch (error) {
        console.error("Get Current Institution Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch current institution",
        });
    }
};

// GET SINGLE INSTITUTION
exports.getInstitutionById = async (req, res) => {
    try {
        const studentId = getStudentId(req);
        const { institutionId } = req.params;

        if (!isValidId(institutionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid institution ID",
            });
        }

        const institution = await Institution.findOne({
            _id: institutionId,
            student: studentId,
        });

        if (!institution) {
            return res.status(404).json({
                success: false,
                message: "Institution not found",
            });
        }

        return res.status(200).json({
            success: true,
            institution,
        });
    } catch (error) {
        console.error("Get Institution Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch institution",
        });
    }
};

// UPDATE INSTITUTION
exports.updateInstitution = async (req, res) => {
    try {
        const studentId = getStudentId(req);
        const { institutionId } = req.params;

        if (!isValidId(institutionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid institution ID",
            });
        }

        const updates = {};

        for (const field of allowedUpdateFields) {
            if (req.body[field] !== undefined) {
                updates[field] =
                    typeof req.body[field] === "string"
                        ? req.body[field].trim()
                        : req.body[field];
            }
        }

        if (
            updates.institutionName !== undefined &&
            !updates.institutionName
        ) {
            return res.status(400).json({
                success: false,
                message: "Institution name cannot be empty",
            });
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update",
            });
        }

        const institution = await Institution.findOneAndUpdate(
            {
                _id: institutionId,
                student: studentId,
            },
            {
                $set: updates,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!institution) {
            return res.status(404).json({
                success: false,
                message: "Institution not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Institution updated successfully",
            institution,
        });
    } catch (error) {
        console.error("Update Institution Error:", error);

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update institution",
        });
    }
};

// UPDATE INSTITUTION STATUS
exports.updateInstitutionStatus = async (req, res) => {
    try {
        const studentId = getStudentId(req);
        const { institutionId } = req.params;
        const { status } = req.body;

        if (!isValidId(institutionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid institution ID",
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid institution status",
            });
        }

        const institution = await Institution.findOne({
            _id: institutionId,
            student: studentId,
        });

        if (!institution) {
            return res.status(404).json({
                success: false,
                message: "Institution not found",
            });
        }

        institution.status = status;

        if (status !== "active") {
            institution.isCurrent = false;

            // Clear current course only for this institution
            await AcademicProgram.updateMany(
                {
                    student: studentId,
                    institution: institution._id,
                    isCurrent: true,
                },
                {
                    $set: { isCurrent: false },
                }
            );
        }

        if (status === "completed" || status === "transferred") {
            institution.endDate = new Date();
        }

        await institution.save();

        return res.status(200).json({
            success: true,
            message: "Institution status updated successfully",
            institution,
        });
    } catch (error) {
        console.error("Update Institution Status Error:", error);

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update institution status",
        });
    }
};

// SELECT CURRENT INSTITUTION
exports.selectCurrentInstitution = async (req, res) => {
    try {
        const studentId = getStudentId(req);
        const { institutionId } = req.params;

        if (!isValidId(institutionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid institution ID",
            });
        }

        const institution = await Institution.findOne({
            _id: institutionId,
            student: studentId,
            status: "active",
        });

        if (!institution) {
            return res.status(404).json({
                success: false,
                message: "Active institution not found",
            });
        }

        // Clear previous institution selection
        await Institution.updateMany(
            {
                student: studentId,
                isCurrent: true,
            },
            {
                $set: { isCurrent: false },
            }
        );

        // Clear current course selection.
        // Historical courses and their records remain untouched.
        await AcademicProgram.updateMany(
            {
                student: studentId,
                isCurrent: true,
            },
            {
                $set: { isCurrent: false },
            }
        );

        institution.isCurrent = true;
        await institution.save();

        return res.status(200).json({
            success: true,
            message: "Current institution selected successfully",
            institution,
        });
    } catch (error) {
        console.error("Select Current Institution Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to select current institution",
        });
    }
};
