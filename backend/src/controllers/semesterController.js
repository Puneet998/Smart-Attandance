
const mongoose = require("mongoose");

const Semester = require("../models/Semester");
const AcademicProgram = require("../models/AcademicProgram");
const Department = require("../models/Department");

// ==========================================
// HELPERS
// ==========================================

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getSemesterScope = (programId, departmentId = null) => ({
    academicProgram: programId,
    department: departmentId || null,
});

const getAcademicYear = (startYear, yearNumber) => {
    const yearStart = Number(startYear) + yearNumber - 1;
    const yearEnd = yearStart + 1;

    return `${yearStart}-${String(yearEnd).slice(-2)}`;
};

const validateDate = (date) => {
    if (!date) return false;
    return !Number.isNaN(new Date(date).getTime());
};

// ==========================================
// GENERATE ALL SEMESTERS AUTOMATICALLY
// POST /api/semesters/generate
// ==========================================

exports.generateSemesters = async (req, res) => {
    try {
        const { academicProgram, departmentId } = req.body;

        if (!academicProgram || !isValidId(academicProgram)) {
            return res.status(400).json({
                success: false,
                message: "Valid academic program ID is required",
            });
        }

        const program = await AcademicProgram.findOne({
            _id: academicProgram,
            student: req.user.id,
        });

        if (!program) {
            return res.status(404).json({
                success: false,
                message: "Academic program not found",
            });
        }

        const startYear = Number(program.batchStartYear);
        const endYear = Number(program.batchEndYear);
        const totalSemesters = Number(program.totalSemesters);

        if (
            !Number.isInteger(startYear) ||
            !Number.isInteger(endYear) ||
            endYear <= startYear ||
            !Number.isInteger(totalSemesters) ||
            totalSemesters < 1 ||
            totalSemesters > 20
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid batch years or total semesters in academic program",
            });
        }

        const durationYears = endYear - startYear;

        // Standard academic structure: 2 semesters per year
        if (totalSemesters > durationYears * 2) {
            return res.status(400).json({
                success: false,
                message: `Maximum ${durationYears * 2} semesters are allowed for this batch duration`,
            });
        }

        // Validate optional department
        let department = null;

        if (departmentId) {
            if (!isValidId(departmentId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department ID",
                });
            }

            department = await Department.findOne({
                _id: departmentId,
                student: req.user.id,
                institution: program.institution,
                academicProgram: program._id,
            });

            if (!department) {
                return res.status(404).json({
                    success: false,
                    message: "Department not found for this academic program",
                });
            }
        }

        const scope = getSemesterScope(
            program._id,
            department?._id || null
        );

        const existingSemesters = await Semester.find({
            ...scope,
            student: req.user.id,
        }).select("semesterNumber");

        const existingNumbers = new Set(
            existingSemesters.map((item) => item.semesterNumber)
        );

        const semestersToCreate = [];

        for (let number = 1; number <= totalSemesters; number++) {
            if (existingNumbers.has(number)) {
                continue;
            }

            const yearNumber = Math.ceil(number / 2);

            semestersToCreate.push({
                student: req.user.id,
                institution: program.institution,
                academicProgram: program._id,
                department: department?._id || null,

                semesterNumber: number,
                yearNumber,
                semesterName: `Semester ${number}`,

                academicYear: getAcademicYear(
                    startYear,
                    yearNumber
                ),

                startDate: null,
                endDate: null,
                attendanceTarget: null,
                status: "upcoming",
                completedAt: null,
            });
        }

        if (semestersToCreate.length > 0) {
            await Semester.insertMany(semestersToCreate, {
                ordered: true,
            });
        }

        const semesters = await Semester.find({
            ...scope,
            student: req.user.id,
        })
            .populate("department", "departmentName departmentCode")
            .sort({ semesterNumber: 1 });

        return res.status(201).json({
            success: true,
            message:
                semestersToCreate.length > 0
                    ? "Semesters generated successfully"
                    : "All semesters are already generated",

            generatedCount: semestersToCreate.length,
            total: semesters.length,
            semesters,
        });
    } catch (error) {
        console.error("Generate Semesters Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Some semesters already exist. Please refresh and try again.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to generate semesters",
        });
    }
};

// ==========================================
// GET ALL SEMESTERS OF A PROGRAM
// GET /api/semesters/program/:programId
// ==========================================

exports.getProgramSemesters = async (req, res) => {
    try {
        const { programId } = req.params;
        const { departmentId } = req.query;

        if (!isValidId(programId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid program ID",
            });
        }

        const program = await AcademicProgram.findOne({
            _id: programId,
            student: req.user.id,
        });

        if (!program) {
            return res.status(404).json({
                success: false,
                message: "Academic program not found",
            });
        }

        const filter = {
            academicProgram: program._id,
            student: req.user.id,
            department: null,
        };

        if (departmentId) {
            if (!isValidId(departmentId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department ID",
                });
            }

            const department = await Department.findOne({
                _id: departmentId,
                student: req.user.id,
                institution: program.institution,
                academicProgram: program._id,
            });

            if (!department) {
                return res.status(404).json({
                    success: false,
                    message: "Department not found",
                });
            }

            filter.department = department._id;
        }

        const semesters = await Semester.find(filter)
            .populate("department", "departmentName departmentCode")
            .sort({ semesterNumber: 1 });

        return res.status(200).json({
            success: true,
            total: semesters.length,
            semesters,
        });
    } catch (error) {
        console.error("Get Semesters Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch semesters",
        });
    }
};

// ==========================================
// GET SINGLE SEMESTER
// GET /api/semesters/:semesterId
// ==========================================

exports.getSemesterById = async (req, res) => {
    try {
        const { semesterId } = req.params;

        if (!isValidId(semesterId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid semester ID",
            });
        }

        const semester = await Semester.findOne({
            _id: semesterId,
            student: req.user.id,
        })
            .populate(
                "academicProgram",
                "programName degree course totalSemesters batchStartYear batchEndYear"
            )
            .populate(
                "department",
                "departmentName departmentCode"
            );

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: "Semester not found",
            });
        }

        return res.status(200).json({
            success: true,
            semester,
        });
    } catch (error) {
        console.error("Get Semester Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch semester",
        });
    }
};

// ==========================================
// START / SELECT CURRENT SEMESTER
// PATCH /api/semesters/:semesterId/start
// ==========================================

exports.startSemester = async (req, res) => {
    try {
        const { semesterId } = req.params;
        const { startDate, endDate, attendanceTarget } = req.body;

        if (!isValidId(semesterId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid semester ID",
            });
        }

        // All three fields are mandatory
        if (!startDate || !endDate || attendanceTarget === undefined || attendanceTarget === null || attendanceTarget === "") {
            return res.status(400).json({
                success: false,
                message: "Start date, end date and attendance target are required",
            });
        }

        if (!validateDate(startDate)) {
            return res.status(400).json({
                success: false,
                message: "Invalid start date",
            });
        }

        if (!validateDate(endDate)) {
            return res.status(400).json({
                success: false,
                message: "Invalid end date",
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: "End date must be after start date",
            });
        }

        const target = Number(attendanceTarget);

        if (
            !Number.isFinite(target) ||
            target < 1 ||
            target > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Attendance target must be between 1 and 100",
            });
        }

        const semester = await Semester.findOne({
            _id: semesterId,
            student: req.user.id,
        });

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: "Semester not found",
            });
        }

        if (semester.status !== "upcoming") {
            return res.status(400).json({
                success: false,
                message: "Only upcoming semesters can be started",
            });
        }

        const semesterScope = getSemesterScope(
            semester.academicProgram,
            semester.department
        );

        // Check another current semester in the same scope
        const previousCurrent = await Semester.findOne({
            ...semesterScope,
            student: req.user.id,
            status: "current",
            _id: { $ne: semester._id },
        });

        if (previousCurrent) {
            return res.status(409).json({
                success: false,
                message: "Complete the current semester before starting another one",
                currentSemester: previousCurrent.semesterName,
            });
        }

        // Previous semester must be completed first
        if (semester.semesterNumber > 1) {
            const previousSemester = await Semester.findOne({
                ...semesterScope,
                student: req.user.id,
                semesterNumber: semester.semesterNumber - 1,
            });

            if (
                !previousSemester ||
                previousSemester.status !== "completed"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Complete the previous semester before starting this semester",
                });
            }
        }

        semester.startDate = start;
        semester.endDate = end;
        semester.attendanceTarget = target;
        semester.status = "current";

        await semester.save();

        return res.status(200).json({
            success: true,
            message: "Semester selected as current successfully",
            semester,
        });
    } catch (error) {
        console.error("Start Semester Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Another semester is already current",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to start semester",
        });
    }
};

// ==========================================
// COMPLETE CURRENT SEMESTER
// PATCH /api/semesters/:semesterId/complete
// ==========================================

exports.completeSemester = async (req, res) => {
    try {
        const { semesterId } = req.params;

        if (!isValidId(semesterId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid semester ID",
            });
        }

        const semester = await Semester.findOne({
            _id: semesterId,
            student: req.user.id,
        });

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: "Semester not found",
            });
        }

        if (semester.status !== "current") {
            return res.status(400).json({
                success: false,
                message: "Only the current semester can be completed",
            });
        }

        semester.status = "completed";
        semester.completedAt = new Date();

        await semester.save();

        return res.status(200).json({
            success: true,
            message: "Semester completed successfully",
            semester,
        });
    } catch (error) {
        console.error("Complete Semester Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to complete semester",
        });
    }
};

// ==========================================
// GET CURRENT SEMESTER
// GET /api/semesters/program/:programId/current
// ==========================================

exports.getCurrentSemester = async (req, res) => {
    try {
        const { programId } = req.params;
        const { departmentId } = req.query;

        if (!isValidId(programId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid program ID",
            });
        }

        const program = await AcademicProgram.findOne({
            _id: programId,
            student: req.user.id,
        });

        if (!program) {
            return res.status(404).json({
                success: false,
                message: "Academic program not found",
            });
        }

        // const filter = {
        //     academicProgram: program._id,
        //     student: req.user.id,
        //     department: null,
        //     status: "current",
        // };


        const filter = {
            academicProgram: programId,
            student: req.user.id,
            status: "current",
        };

        if (departmentId) {
            filter.department = departmentId;
        }

        if (departmentId) {
            if (!isValidId(departmentId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department ID",
                });
            }

            const department = await Department.findOne({
                _id: departmentId,
                student: req.user.id,
                institution: program.institution,
                academicProgram: program._id,
            });

            if (!department) {
                return res.status(404).json({
                    success: false,
                    message: "Department not found",
                });
            }

            filter.department = department._id;
        }

        const semester = await Semester.findOne(filter)
            .select(
                "_id semesterNumber yearNumber semesterName academicYear startDate endDate status department"
            )
            .populate({
                path: "department",
                select: "departmentName departmentCode",
            })
            .lean();

        return res.status(200).json({
            success: true,
            semester,
            message: semester
                ? "Current semester fetched successfully"
                : "No current semester found",
        });
    } catch (error) {
        console.error("Get Current Semester Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch current semester",
        });
    }
};

// ==========================================
// GET SEMESTER HISTORY
// GET /api/semesters/program/:programId/history
// ==========================================

exports.getSemesterHistory = async (req, res) => {
    try {
        const { programId } = req.params;
        const { departmentId } = req.query;

        if (!isValidId(programId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid program ID",
            });
        }

        const program = await AcademicProgram.findOne({
            _id: programId,
            student: req.user.id,
        });

        if (!program) {
            return res.status(404).json({
                success: false,
                message: "Academic program not found",
            });
        }

        const filter = {
            academicProgram: program._id,
            student: req.user.id,
            department: null,
            status: "completed",
        };

        if (departmentId) {
            if (!isValidId(departmentId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department ID",
                });
            }

            const department = await Department.findOne({
                _id: departmentId,
                student: req.user.id,
                institution: program.institution,
                academicProgram: program._id,
            });

            if (!department) {
                return res.status(404).json({
                    success: false,
                    message: "Department not found",
                });
            }

            filter.department = department._id;
        }

        const semesters = await Semester.find(filter)
            .populate("department", "departmentName departmentCode")
            .sort({ semesterNumber: -1 });

        return res.status(200).json({
            success: true,
            total: semesters.length,
            history: semesters,
        });
    } catch (error) {
        console.error("Get Semester History Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch semester history",
        });
    }
};
