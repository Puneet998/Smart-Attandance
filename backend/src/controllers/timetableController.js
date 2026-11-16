
const mongoose = require("mongoose");
const Timetable = require("../models/Timetable");
const Semester = require("../models/Semester");
const Subject = require("../models/Subject");

// ==========================================
// CONSTANTS
// ==========================================

const VALID_DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
];

const VALID_ENTRY_TYPES = ["lecture", "break"];

// ==========================================
// HELPER: VALIDATE OBJECT ID
// ==========================================

const isValidId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// ==========================================
// HELPER: CONVERT TIME INTO MINUTES
// ==========================================

const timeToMinutes = (time) => {
    if (
        typeof time !== "string" ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
    ) {
        return null;
    }

    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
};

// ==========================================
// HELPER: VALIDATE TIMETABLE ENTRY
// ==========================================

const validateTimetableEntry = ({
    entryType,
    dayOfWeek,
    subject,
    startTime,
    endTime,
}) => {
    // Validate entry type
    if (!VALID_ENTRY_TYPES.includes(entryType)) {
        return "Invalid timetable entry type";
    }

    // Validate day
    if (!VALID_DAYS.includes(dayOfWeek)) {
        return "Please select a valid day";
    }

    // Subject required only for lecture
    if (entryType === "lecture" && !subject) {
        return "Subject is required for a lecture";
    }

    // Subject should not be supplied for break
    if (entryType === "break" && subject) {
        return "Subject should not be selected for a break";
    }

    // Validate start and end time
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    if (start === null || end === null) {
        return "Invalid time format. Use HH:mm";
    }

    // End time must be greater than start time
    if (end <= start) {
        return "End time must be after start time";
    }

    return null;
};

// ==========================================
// HELPER: GET VALID SEMESTER
// ==========================================

const getValidSemester = async (semesterId, studentId) => {
    if (!isValidId(semesterId)) {
        return {
            error: "Invalid semester ID",
            status: 400,
        };
    }

    const semester = await Semester.findOne({
        _id: semesterId,
        student: studentId,
    });

    if (!semester) {
        return {
            error: "Semester not found",
            status: 404,
        };
    }

    if (!["upcoming", "current"].includes(semester.status)) {
        return {
            error: "Cannot manage timetable for a completed semester",
            status: 400,
        };
    }

    return { semester };
};

// ==========================================
// HELPER: VERIFY SUBJECT OWNERSHIP
// ==========================================

const getValidSubject = async (
    subjectId,
    semesterId,
    studentId
) => {
    if (!subjectId || !isValidId(subjectId)) {
        return null;
    }

    return Subject.findOne({
        _id: subjectId,
        student: studentId,
        semester: semesterId,
        status: "active",
    }).select("_id subjectName subjectCode teacherName");
};

// ==========================================
// HELPER: CHECK TIME CONFLICT
// ==========================================

const hasTimeConflict = async ({
    studentId,
    semesterId,
    dayOfWeek,
    startTime,
    endTime,
    excludeId = null,
}) => {
    const query = {
        student: studentId,
        semester: semesterId,
        dayOfWeek,
        status: "active",

        // Overlapping time condition
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
    };

    // Exclude current entry during update
    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    return Timetable.exists(query);
};

// ==========================================
// HELPER: POPULATE SUBJECT
// ==========================================

const populateTimetable = (query) => {
    return query.populate(
        "subject",
        "subjectName subjectCode teacherName"
    );
};

// ==========================================
// CREATE TIMETABLE ENTRY
// POST /api/timetables
// ==========================================

const createTimetable = async (req, res) => {
    try {
        const {
            semester,
            entryType = "lecture",
            dayOfWeek,
            subject,
            startTime,
            endTime,
        } = req.body;

        const studentId = req.user.id;

        // Validate semester
        if (!semester) {
            return res.status(400).json({
                success: false,
                message: "Semester is required",
            });
        }

        // Validate all timetable fields
        const validationError = validateTimetableEntry({
            entryType,
            dayOfWeek,
            subject,
            startTime,
            endTime,
        });

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError,
            });
        }

        // Verify semester ownership
        const semesterResult = await getValidSemester(
            semester,
            studentId
        );

        if (semesterResult.error) {
            return res.status(semesterResult.status).json({
                success: false,
                message: semesterResult.error,
            });
        }

        const semesterData = semesterResult.semester;

        // Verify subject only for lectures
        let subjectData = null;

        if (entryType === "lecture") {
            subjectData = await getValidSubject(
                subject,
                semesterData._id,
                studentId
            );

            if (!subjectData) {
                return res.status(400).json({
                    success: false,
                    message: "Selected subject is invalid or does not belong to this semester",
                });
            }
        }

        // Check overlapping lectures and breaks
        const conflict = await hasTimeConflict({
            studentId,
            semesterId: semesterData._id,
            dayOfWeek,
            startTime,
            endTime,
        });

        if (conflict) {
            return res.status(409).json({
                success: false,
                message: "Another lecture or break already exists during this time",
            });
        }

        // Create timetable entry
        const timetable = await Timetable.create({
            student: studentId,
            institution: semesterData.institution,
            academicProgram: semesterData.academicProgram,
            department: semesterData.department || null,
            semester: semesterData._id,

            entryType,
            dayOfWeek,

            // Break will always have subject null
            subject: entryType === "lecture"
                ? subjectData._id
                : null,

            startTime,
            endTime,
        });

        const populatedTimetable = await populateTimetable(
            Timetable.findById(timetable._id)
        );

        return res.status(201).json({
            success: true,
            message: entryType === "break"
                ? "Break added successfully"
                : "Lecture added successfully",
            timetable: populatedTimetable,
        });

    } catch (error) {
        console.error("Create timetable error:", error);

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to add timetable entry",
        });
    }
};

// ==========================================
// GET TIMETABLE BY SEMESTER
// GET /api/timetables/semester/:semesterId
// ==========================================

const getTimetableBySemester = async (req, res) => {
    try {
        const { semesterId } = req.params;
        const studentId = req.user.id;

        if (!isValidId(semesterId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid semester ID",
            });
        }

        // Verify semester ownership
        const semester = await Semester.findOne({
            _id: semesterId,
            student: studentId,
        }).select("_id");

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: "Semester not found",
            });
        }

        // Get all active lectures and breaks
        const timetable = await populateTimetable(
            Timetable.find({
                semester: semesterId,
                student: studentId,
                status: "active",
            })
        ).sort({
            dayOfWeek: 1,
            startTime: 1,
        });

        return res.status(200).json({
            success: true,
            count: timetable.length,
            timetable,
        });

    } catch (error) {
        console.error("Get timetable error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch timetable",
        });
    }
};

// ==========================================
// UPDATE TIMETABLE ENTRY
// PATCH /api/timetables/:timetableId
// ==========================================

const updateTimetable = async (req, res) => {
    try {
        const { timetableId } = req.params;

        const {
            entryType,
            dayOfWeek,
            subject,
            startTime,
            endTime,
        } = req.body;

        const studentId = req.user.id;

        if (!isValidId(timetableId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid timetable ID",
            });
        }

        // Find existing active timetable entry
        const timetable = await Timetable.findOne({
            _id: timetableId,
            student: studentId,
            status: "active",
        });

        if (!timetable) {
            return res.status(404).json({
                success: false,
                message: "Timetable entry not found",
            });
        }

        // Verify semester
        const semesterResult = await getValidSemester(
            timetable.semester,
            studentId
        );

        if (semesterResult.error) {
            return res.status(semesterResult.status).json({
                success: false,
                message: semesterResult.error,
            });
        }

        // Use existing values if a field was not supplied
        const updatedEntry = {
            entryType: entryType !== undefined
                ? entryType
                : timetable.entryType,

            dayOfWeek: dayOfWeek !== undefined
                ? dayOfWeek
                : timetable.dayOfWeek,

            subject: subject !== undefined
                ? subject
                : timetable.subject
                    ? timetable.subject.toString()
                    : null,

            startTime: startTime !== undefined
                ? startTime
                : timetable.startTime,

            endTime: endTime !== undefined
                ? endTime
                : timetable.endTime,
        };

        // If converting lecture to break, subject must be null
        if (updatedEntry.entryType === "break") {
            updatedEntry.subject = null;
        }

        // Validate updated fields
        const validationError = validateTimetableEntry(updatedEntry);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError,
            });
        }

        // Verify subject only for lectures
        let subjectData = null;

        if (updatedEntry.entryType === "lecture") {
            subjectData = await getValidSubject(
                updatedEntry.subject,
                timetable.semester,
                studentId
            );

            if (!subjectData) {
                return res.status(400).json({
                    success: false,
                    message: "Selected subject is invalid or does not belong to this semester",
                });
            }
        }

        // Check overlap, excluding current entry
        const conflict = await hasTimeConflict({
            studentId,
            semesterId: timetable.semester,
            dayOfWeek: updatedEntry.dayOfWeek,
            startTime: updatedEntry.startTime,
            endTime: updatedEntry.endTime,
            excludeId: timetable._id,
        });

        if (conflict) {
            return res.status(409).json({
                success: false,
                message: "Another lecture or break already exists during this time",
            });
        }

        // Update entry
        timetable.entryType = updatedEntry.entryType;
        timetable.dayOfWeek = updatedEntry.dayOfWeek;

        timetable.subject = updatedEntry.entryType === "lecture"
            ? subjectData._id
            : null;

        timetable.startTime = updatedEntry.startTime;
        timetable.endTime = updatedEntry.endTime;

        await timetable.save();

        const updatedTimetable = await populateTimetable(
            Timetable.findById(timetable._id)
        );

        return res.status(200).json({
            success: true,
            message: updatedEntry.entryType === "break"
                ? "Break updated successfully"
                : "Lecture updated successfully",
            timetable: updatedTimetable,
        });

    } catch (error) {
        console.error("Update timetable error:", error);

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update timetable entry",
        });
    }
};

// ==========================================
// ARCHIVE TIMETABLE ENTRY
// DELETE /api/timetables/:timetableId
// ==========================================

const deleteTimetable = async (req, res) => {
    try {
        const { timetableId } = req.params;
        const studentId = req.user.id;

        if (!isValidId(timetableId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid timetable ID",
            });
        }

        const timetable = await Timetable.findOne({
            _id: timetableId,
            student: studentId,
            status: "active",
        });

        if (!timetable) {
            return res.status(404).json({
                success: false,
                message: "Timetable entry not found",
            });
        }

        const semesterResult = await getValidSemester(
            timetable.semester,
            studentId
        );

        if (semesterResult.error) {
            return res.status(semesterResult.status).json({
                success: false,
                message: semesterResult.error,
            });
        }

        timetable.status = "archived";

        await timetable.save();

        return res.status(200).json({
            success: true,
            message: timetable.entryType === "break"
                ? "Break archived successfully"
                : "Lecture archived successfully",
        });

    } catch (error) {
        console.error("Delete timetable error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to archive timetable entry",
        });
    }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    createTimetable,
    getTimetableBySemester,
    updateTimetable,
    deleteTimetable,
};
