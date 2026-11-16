
const AcademicProgram = require("../models/AcademicProgram");
const Institution = require("../models/Institution");

// Allowed update fields
// Department and specialization are intentionally excluded.
const allowedUpdateFields = [
    "programName",
    "degree",
    "course",
    "batchStartYear",
    "batchEndYear",
    "totalSemesters",
    "academicYear",
    "attendanceTarget",
];

// CREATE ACADEMIC PROGRAM
exports.createAcademicProgram = async (req, res) => {
    try {
        const {
            institution,
            programName,
            degree,
            course,
            batchStartYear,
            batchEndYear,
            totalSemesters,
            academicYear,
            attendanceTarget,
        } = req.body;

        // Required field validation
        if (
            !institution ||
            typeof programName !== "string" ||
            !programName.trim() ||
            typeof degree !== "string" ||
            !degree.trim() ||
            typeof course !== "string" ||
            !course.trim() ||
            batchStartYear === undefined ||
            batchStartYear === "" ||
            batchEndYear === undefined ||
            batchEndYear === "" ||
            totalSemesters === undefined ||
            totalSemesters === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required academic details",
            });
        }

        // Validate batch years
        if (
            !Number.isInteger(Number(batchStartYear)) ||
            !Number.isInteger(Number(batchEndYear)) ||
            Number(batchStartYear) < 1900 ||
            Number(batchEndYear) > 2100 ||
            Number(batchEndYear) <= Number(batchStartYear)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid batch start and end years",
            });
        }

        // Validate semester count
        if (
            !Number.isInteger(Number(totalSemesters)) ||
            Number(totalSemesters) < 1 ||
            Number(totalSemesters) > 20
        ) {
            return res.status(400).json({
                success: false,
                message: "Total semesters must be between 1 and 20",
            });
        }

        // Validate attendance target
        const target = attendanceTarget ?? 75;

        if (
            !Number.isFinite(Number(target)) ||
            Number(target) < 1 ||
            Number(target) > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Attendance target must be between 1 and 100",
            });
        }

        // Verify institution ownership
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

        // Create academic program
        // Department and specialization are not part of this model.
        const academicProgram = await AcademicProgram.create({
            student: req.user.id,
            institution: institutionRecord._id,

            programName: programName.trim(),
            degree: degree.trim(),
            course: course.trim(),

            batchStartYear: Number(batchStartYear),
            batchEndYear: Number(batchEndYear),
            totalSemesters: Number(totalSemesters),

            academicYear: academicYear?.trim() || "",
            attendanceTarget: Number(target),

            status: "active",
            isCurrent: false,
        });

        return res.status(201).json({
            success: true,
            message: "Academic program created successfully",
            academicProgram,
        });

    } catch (error) {
        console.error("Create Academic Program Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid institution ID",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create academic program",
        });
    }
};


// GET ALL ACADEMIC PROGRAMS
exports.getAcademicPrograms = async (req, res) => {
    try {
        const filter = {
            student: req.user.id,
        };

        // Optional institution filter
        if (req.query.institution) {
            filter.institution = req.query.institution;
        }

        const programs = await AcademicProgram.find(filter)
            .populate(
                "institution",
                "institutionName universityName city"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            total: programs.length,
            academicPrograms: programs,
        });

    } catch (error) {
        console.error("Get Academic Programs Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid institution ID",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to fetch academic programs",
        });
    }
};


// GET SINGLE ACADEMIC PROGRAM
exports.getAcademicProgramById = async (req, res) => {
    try {
        const academicProgram = await AcademicProgram.findOne({
            _id: req.params.programId,
            student: req.user.id,
        }).populate(
            "institution",
            "institutionName universityName city state"
        );

        if (!academicProgram) {
            return res.status(404).json({
                success: false,
                message: "Academic program not found",
            });
        }

        return res.status(200).json({
            success: true,
            academicProgram,
        });

    } catch (error) {
        console.error("Get Academic Program Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid program ID",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to fetch academic program",
        });
    }
};


// UPDATE ACADEMIC PROGRAM
exports.updateAcademicProgram = async (req, res) => {
    try {
        const updates = {};

        // Only allow approved fields
        for (const field of allowedUpdateFields) {
            if (req.body[field] !== undefined) {
                updates[field] =
                    typeof req.body[field] === "string"
                        ? req.body[field].trim()
                        : req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update",
            });
        }

        // Find existing program owned by logged-in student
        const existingProgram = await AcademicProgram.findOne({
            _id: req.params.programId,
            student: req.user.id,
        });

        if (!existingProgram) {
            return res.status(404).json({
                success: false,
                message: "Academic program not found",
            });
        }

        // Validate batch years
        const startYear =
            updates.batchStartYear ?? existingProgram.batchStartYear;

        const endYear =
            updates.batchEndYear ?? existingProgram.batchEndYear;

        if (
            !Number.isInteger(Number(startYear)) ||
            !Number.isInteger(Number(endYear)) ||
            Number(startYear) < 1900 ||
            Number(endYear) > 2100 ||
            Number(endYear) <= Number(startYear)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid batch year range",
            });
        }

        // Validate semester count
        const semesterCount =
            updates.totalSemesters ?? existingProgram.totalSemesters;

        if (
            !Number.isInteger(Number(semesterCount)) ||
            Number(semesterCount) < 1 ||
            Number(semesterCount) > 20
        ) {
            return res.status(400).json({
                success: false,
                message: "Total semesters must be between 1 and 20",
            });
        }

        // Validate attendance target
        const target =
            updates.attendanceTarget ?? existingProgram.attendanceTarget;

        if (
            !Number.isFinite(Number(target)) ||
            Number(target) < 1 ||
            Number(target) > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Attendance target must be between 1 and 100",
            });
        }

        // Convert numeric fields before updating
        if (updates.batchStartYear !== undefined) {
            updates.batchStartYear = Number(updates.batchStartYear);
        }

        if (updates.batchEndYear !== undefined) {
            updates.batchEndYear = Number(updates.batchEndYear);
        }

        if (updates.totalSemesters !== undefined) {
            updates.totalSemesters = Number(updates.totalSemesters);
        }

        if (updates.attendanceTarget !== undefined) {
            updates.attendanceTarget = Number(updates.attendanceTarget);
        }

        const academicProgram = await AcademicProgram.findOneAndUpdate(
            {
                _id: req.params.programId,
                student: req.user.id,
            },
            {
                $set: updates,
            },
            {
                new: true,
                runValidators: true,
            }
        ).populate(
            "institution",
            "institutionName universityName"
        );

        return res.status(200).json({
            success: true,
            message: "Academic program updated successfully",
            academicProgram,
        });

    } catch (error) {
        console.error("Update Academic Program Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid program ID",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update academic program",
        });
    }
};


// UPDATE ACADEMIC PROGRAM STATUS
exports.updateAcademicProgramStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            "active",
            "completed",
            "discontinued",
            "transferred",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid academic program status",
            });
        }

        const academicProgram = await AcademicProgram.findOneAndUpdate(
            {
                _id: req.params.programId,
                student: req.user.id,
            },
            {
                $set: {
                    status,
                    ...(status === "active"
                        ? {}
                        : { isCurrent: false }),
                },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!academicProgram) {
            return res.status(404).json({
                success: false,
                message: "Academic program not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Academic program status updated successfully",
            academicProgram,
        });

    } catch (error) {
        console.error("Update Academic Program Status Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid program ID",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update academic program status",
        });
    }
};


// SELECT CURRENT ACADEMIC PROGRAM
exports.selectCurrentAcademicProgram = async (req, res) => {
    try {
        const { programId } = req.params;

        // Find program owned by logged-in student
        const program = await AcademicProgram.findOne({
            _id: programId,
            student: req.user.id,
            status: "active",
        });

        if (!program) {
            return res.status(404).json({
                success: false,
                message: "Active academic program not found",
            });
        }

        // Verify that its institution is currently selected
        const institution = await Institution.findOne({
            _id: program.institution,
            student: req.user.id,
            isCurrent: true,
            status: "active",
        });

        if (!institution) {
            return res.status(400).json({
                success: false,
                message: "Select this program's institution first",
            });
        }

        // Clear previous current program
        await AcademicProgram.updateMany(
            {
                student: req.user.id,
                isCurrent: true,
            },
            {
                $set: {
                    isCurrent: false,
                },
            }
        );

        // Select requested program
        program.isCurrent = true;
        await program.save();

        return res.status(200).json({
            success: true,
            message: "Current academic program selected successfully",
            program,
        });

    } catch (error) {
        console.error("Select Current Academic Program Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid program ID",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to select current academic program",
        });
    }
};
