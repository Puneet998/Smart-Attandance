
const mongoose = require("mongoose");

const Attendance = require("../models/Attendance");
const Semester = require("../models/Semester");
const Timetable = require("../models/Timetable");
const Subject = require("../models/Subject");

// const STUDENT_STATUSES = ["present", "absent"];
const STUDENT_STATUSES = ["present", "absent", "lecture_off"];
const TIME_ZONE = "Asia/Kolkata";

// ==========================================
// COMMON HELPERS
// ==========================================

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const parseClassDate = (value) => {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return null;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
    ) {
        return null;
    }

    return date;
};

const getIndiaDateParts = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);

    const values = {};

    parts.forEach((part) => {
        values[part.type] = part.value;
    });

    return `${values.year}-${values.month}-${values.day}`;
};

const getIndiaTimeInMinutes = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);

    const values = {};

    parts.forEach((part) => {
        values[part.type] = Number(part.value);
    });

    return (
        values.hour * 60 +
        values.minute +
        values.second / 60
    );
};

const getDayName = (dateString) => {
    const date = new Date(`${dateString}T12:00:00.000Z`);

    return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "UTC",
    })
        .format(date)
        .toLowerCase();
};

const getSemesterDateString = (date) => {
    if (!date) return null;

    return new Date(date).toISOString().slice(0, 10);
};

const getTimeInMinutes = (time) => {
    if (!/^\d{2}:\d{2}$/.test(time || "")) {
        return null;
    }

    const [hours, minutes] = time.split(":").map(Number);

    if (hours > 23 || minutes > 59) {
        return null;
    }

    return hours * 60 + minutes;
};

const populateAttendance = (query) =>
    query
        .populate("subject", "subjectName subjectCode teacherName")
        .populate("timetable", "dayOfWeek startTime endTime entryType")
        .populate("markedBy", "name email");

// ==========================================
// AUTHENTICATION VALIDATION
// ==========================================

const validateUser = (req, res) => {
    const userId = req.user?.id;

    if (!userId || !isValidId(userId)) {
        res.status(401).json({
            success: false,
            message: "Unauthorized user",
        });

        return null;
    }

    return userId;
};

// ==========================================
// VALIDATE SEMESTER DATE RANGE
// ==========================================

const validateSemesterPeriod = (semester) => {
    const today = getIndiaDateParts();

    if (!semester.startDate || !semester.endDate) {
        return {
            valid: false,
            message: "Semester start date or end date is not configured",
        };
    }

    const startDate = getSemesterDateString(semester.startDate);
    const endDate = getSemesterDateString(semester.endDate);

    if (today < startDate) {
        return {
            valid: false,
            message: "Your Semester Has Not Started Yet",
        };
    }

    if (today > endDate || semester.status === "completed") {
        return {
            valid: false,
            message: "Your Semester Has Ended",
        };
    }

    if (semester.status !== "current") {
        return {
            valid: false,
            message: "Your semester is not currently active",
        };
    }

    return { valid: true };
};

// ==========================================
// VALIDATE TODAY'S DATE
// ==========================================


// ==========================================
// VALIDATE CLASS DATE
// ==========================================

const validateClassDate = (classDate, semester) => {
    const today = getIndiaDateParts();

    const startDate = getSemesterDateString(semester.startDate);
    const endDate = getSemesterDateString(semester.endDate);

    if (!startDate || !endDate) {
        return {
            valid: false,
            message: "Semester start date or end date is not configured",
        };
    }

    if (classDate > today) {
        return {
            valid: false,
            message: "Future date attendance cannot be marked",
        };
    }

    if (classDate < startDate || classDate > endDate) {
        return {
            valid: false,
            message: "Attendance date must be within the semester timeline",
        };
    }

    return { valid: true };
};


// ==========================================
// VALIDATE LECTURE ATTENDANCE WINDOW
// ==========================================

const validateLectureWindow = (timetable, classDate) => {
    const today = getIndiaDateParts();

    const startMinutes = getTimeInMinutes(timetable.startTime);
    const endMinutes = getTimeInMinutes(timetable.endTime);

    if (
        startMinutes === null ||
        endMinutes === null ||
        endMinutes <= startMinutes
    ) {
        return {
            valid: false,
            message: "Invalid lecture timing configured in timetable",
        };
    }

    // Past lecture dates can be marked later.
    // Semester date validation is handled separately.
    if (classDate < today) {
        return { valid: true };
    }

    const now = getIndiaTimeInMinutes();

    // Attendance opens in the final 10 minutes of the lecture.
    const windowStart = Math.max(startMinutes, endMinutes - 10);

    if (now < windowStart) {
        return {
            valid: false,
            message: `Attendance will open at ${formatMinutes(windowStart)}`,
        };
    }

    // Once today's attendance window opens,
    // it remains open for the rest of the day.
    return { valid: true };
};


// ==========================================
// VALIDATE LAST 10 MINUTES OF LECTURE
// ==========================================



const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);

    return `${String(hours).padStart(2, "0")}:${String(
        remainingMinutes
    ).padStart(2, "0")}`;
};

// ==========================================
// GET AND VALIDATE LECTURE
// ==========================================

const getValidLecture = async ({
    timetableId,
    userId,
    semesterId,
    classDate,
}) => {
    const dayName = getDayName(classDate);

    const timetable = await Timetable.findOne({
        _id: timetableId,
        student: userId,
        semester: semesterId,
        status: "active",
        entryType: "lecture",
        dayOfWeek: dayName,
    });

    if (!timetable || !timetable.subject) {
        return {
            valid: false,
            statusCode: 404,
            message: "Lecture not found in timetable for this date",
        };
    }

    const subject = await Subject.findOne({
        _id: timetable.subject,
        student: userId,
        semester: semesterId,
        status: "active",
    });

    if (!subject) {
        return {
            valid: false,
            statusCode: 404,
            message: "Active subject not found",
        };
    }

    const windowCheck = validateLectureWindow(
        timetable,
        classDate
    );

    if (!windowCheck.valid) {
        return {
            valid: false,
            statusCode: 400,
            message: windowCheck.message,
        };
    }

    return {
        valid: true,
        timetable,
        subject,
    };
};


// ==========================================
// GET AND VALIDATE STUDENT SEMESTER
// ==========================================

const getValidSemester = async (semesterId, userId) => {
    const semester = await Semester.findOne({
        _id: semesterId,
        student: userId,
    });

    if (!semester) {
        return {
            valid: false,
            statusCode: 404,
            message: "Semester not found",
        };
    }

    const periodCheck = validateSemesterPeriod(semester);

    if (!periodCheck.valid) {
        return {
            valid: false,
            statusCode: 400,
            message: periodCheck.message,
        };
    }

    return {
        valid: true,
        semester,
    };
};

// ==========================================
// CREATE ATTENDANCE RECORD
// ==========================================

const createAttendanceRecord = async ({
    userId,
    semester,
    timetable,
    subject,
    date,
    status,
    notes = "",
}) => {
    return Attendance.create({
        student: userId,
        institution: semester.institution,
        academicProgram: semester.academicProgram,
        department: semester.department || null,
        semester: semester._id,
        subject: subject._id,
        timetable: timetable._id,
        classDate: date,
        classStartTime: timetable.startTime,
        classEndTime: timetable.endTime,
        status,
        markedBy: userId,
        markedAt: new Date(),
        notes: notes.trim(),
    });
};

// ==========================================
// MARK INDIVIDUAL ATTENDANCE
// POST /api/attendance
// ==========================================

const markAttendance = async (req, res) => {
    try {
        const {
            semester,
            timetableId,
            classDate,
            status,
            notes = "",
        } = req.body;

        const userId = validateUser(req, res);

        if (!userId) return;

        if (!semester || !timetableId || !classDate || !status) {
            return res.status(400).json({
                success: false,
                message: "Semester, timetable, date and status are required",
            });
        }

        if (!isValidId(semester) || !isValidId(timetableId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid semester or timetable ID",
            });
        }

        if (!STUDENT_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Students can only mark Present, Absent or Class Off",
            });
        }

        if (typeof notes !== "string" || notes.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Notes must not exceed 500 characters",
            });
        }

        const date = parseClassDate(classDate);

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Invalid date. Use YYYY-MM-DD format",
            });
        }

        // const todayCheck = validateToday(classDate);

        // if (!todayCheck.valid) {
        //     return res.status(400).json({
        //         success: false,
        //         message: todayCheck.message,
        //     });
        // }

        const semesterCheck = await getValidSemester(
            semester,
            userId
        );

        if (!semesterCheck.valid) {
            return res.status(semesterCheck.statusCode).json({
                success: false,
                message: semesterCheck.message,
            });
        }

        const semesterData = semesterCheck.semester;


        const dateCheck = validateClassDate(
            classDate,
            semesterData
        );

        if (!dateCheck.valid) {
            return res.status(400).json({
                success: false,
                message: dateCheck.message,
            });
        }


        const lectureCheck = await getValidLecture({
            timetableId,
            userId,
            semesterId: semesterData._id,
            classDate,
        });

        if (!lectureCheck.valid) {
            return res.status(lectureCheck.statusCode).json({
                success: false,
                message: lectureCheck.message,
            });
        }

        const existing = await Attendance.findOne({
            student: userId,
            semester: semesterData._id,
            timetable: lectureCheck.timetable._id,
            classDate: date,
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Attendance already exists for this lecture",
            });
        }

        const attendance = await createAttendanceRecord({
            userId,
            semester: semesterData,
            timetable: lectureCheck.timetable,
            subject: lectureCheck.subject,
            date,
            status,
            notes,
        });

        const record = await populateAttendance(
            Attendance.findById(attendance._id)
        );

        return res.status(201).json({
            success: true,
            message: "Attendance marked successfully",
            attendance: record,
        });
    } catch (error) {
        console.error("Mark attendance error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Attendance already exists for this lecture",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to mark attendance",
            error: error.message,
        });
    }
};

// ==========================================
// MARK BULK ATTENDANCE
// POST /api/attendance/bulk
//
// Body:
// {
//   semester: "...",
//   classDate: "YYYY-MM-DD",
//   entries: [
//     { timetableId: "...", status: "present" },
//     { timetableId: "...", status: "absent" }
//   ]
// }
// ==========================================


// ==========================================
// MARK BULK ATTENDANCE
// POST /api/attendance/bulk
// ==========================================

const markBulkAttendance = async (req, res) => {
    try {
        const { semester, classDate, entries } = req.body;

        // 1. Validate logged-in student
        const userId = validateUser(req, res);

        if (!userId) return;

        // 2. Validate request body
        if (!semester || !classDate || !Array.isArray(entries)) {
            return res.status(400).json({
                success: false,
                message: "Semester, class date and entries are required",
            });
        }

        if (!isValidId(semester)) {
            return res.status(400).json({
                success: false,
                message: "Invalid semester ID",
            });
        }

        if (entries.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one lecture is required",
            });
        }

        if (entries.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Maximum 50 lectures can be submitted at once",
            });
        }

        // 3. Validate class date format
        const date = parseClassDate(classDate);

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Invalid date. Use YYYY-MM-DD format",
            });
        }

        // IMPORTANT:
        // Do not use validateToday() here.
        // Past lecture dates are allowed within the semester.

        // 4. Validate semester ownership and active period
        const semesterCheck = await getValidSemester(
            semester,
            userId
        );

        if (!semesterCheck.valid) {
            return res.status(semesterCheck.statusCode).json({
                success: false,
                message: semesterCheck.message,
            });
        }

        const semesterData = semesterCheck.semester;

        // 5. Validate date against semester timeline
        const dateCheck = validateClassDate(
            classDate,
            semesterData
        );

        if (!dateCheck.valid) {
            return res.status(400).json({
                success: false,
                message: dateCheck.message,
            });
        }

        // 6. Validate all selected lectures first
        const seenTimetables = new Set();
        const validatedEntries = [];

        for (const entry of entries) {
            const {
                timetableId,
                status,
                notes = "",
            } = entry;

            if (!timetableId || !isValidId(timetableId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid timetable ID in bulk entries",
                });
            }

            if (!STUDENT_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Students can only mark Present, Absent or Class Off",
                });
            }

            if (
                typeof notes !== "string" ||
                notes.length > 500
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Notes must not exceed 500 characters",
                });
            }

            // Prevent duplicate lecture IDs in one request
            if (seenTimetables.has(String(timetableId))) {
                return res.status(400).json({
                    success: false,
                    message: "Duplicate lecture found in bulk entries",
                });
            }

            seenTimetables.add(String(timetableId));

            // 7. Validate lecture, weekday, subject and time window
            const lectureCheck = await getValidLecture({
                timetableId,
                userId,
                semesterId: semesterData._id,
                classDate,
            });

            if (!lectureCheck.valid) {
                return res.status(lectureCheck.statusCode).json({
                    success: false,
                    message: lectureCheck.message,
                    timetableId,
                });
            }

            // 8. Check existing attendance
            const existing = await Attendance.findOne({
                student: userId,
                semester: semesterData._id,
                timetable: lectureCheck.timetable._id,
                classDate: date,
            });

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Attendance already exists for one or more selected lectures",
                    timetableId,
                });
            }

            validatedEntries.push({
                timetable: lectureCheck.timetable,
                subject: lectureCheck.subject,
                status,
                notes,
            });
        }

        // 9. Create records only after all entries pass validation
        const createdRecords = [];

        for (const entry of validatedEntries) {
            const record = await createAttendanceRecord({
                userId,
                semester: semesterData,
                timetable: entry.timetable,
                subject: entry.subject,
                date,
                status: entry.status,
                notes: entry.notes,
            });

            createdRecords.push(record);
        }

        // 10. Fetch populated records
        const records = await populateAttendance(
            Attendance.find({
                _id: {
                    $in: createdRecords.map(
                        (record) => record._id
                    ),
                },
            }).sort({ classStartTime: 1 })
        );

        // 11. Success response
        return res.status(201).json({
            success: true,
            message: "Bulk attendance marked successfully",
            count: records.length,
            records,
        });

    } catch (error) {
        console.error("Bulk attendance error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Attendance already exists for one or more lectures",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to mark bulk attendance",
            error: error.message,
        });
    }
};


// ==========================================
// GET SEMESTER ATTENDANCE
// GET /api/attendance/semester/:semesterId
// ==========================================

const getSemesterAttendance = async (req, res) => {
    try {
        const { semesterId } = req.params;
        const { subjectId, status, from, to } = req.query;

        const userId = validateUser(req, res);

        if (!userId) return;

        if (!isValidId(semesterId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid semester ID",
            });
        }

        const semester = await Semester.findOne({
            _id: semesterId,
            student: userId,
        });

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: "Semester not found",
            });
        }

        const filter = {
            student: userId,
            semester: semesterId,
        };

        if (subjectId) {
            if (!isValidId(subjectId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid subject ID",
                });
            }

            filter.subject = subjectId;
        }

        if (status) {
            if (!["present", "absent", "lecture_off"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status filter",
                });
            }

            filter.status = status;
        }

        if (from || to) {
            filter.classDate = {};

            if (from) {
                const fromDate = parseClassDate(from);

                if (!fromDate) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid from date",
                    });
                }

                filter.classDate.$gte = fromDate;
            }

            if (to) {
                const toDate = parseClassDate(to);

                if (!toDate) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid to date",
                    });
                }

                toDate.setUTCHours(23, 59, 59, 999);
                filter.classDate.$lte = toDate;
            }

            if (
                filter.classDate.$gte &&
                filter.classDate.$lte &&
                filter.classDate.$gte > filter.classDate.$lte
            ) {
                return res.status(400).json({
                    success: false,
                    message: "From date cannot be after to date",
                });
            }
        }

        const records = await populateAttendance(
            Attendance.find(filter).sort({
                classDate: -1,
                classStartTime: -1,
            })
        );

        return res.status(200).json({
            success: true,
            count: records.length,
            records,
        });
    } catch (error) {
        console.error("Get attendance error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch attendance",
            error: error.message,
        });
    }
};

// ==========================================
// UPDATE STUDENT ATTENDANCE
// PATCH /api/attendance/:attendanceId
// ==========================================

const updateAttendance = async (req, res) => {
    try {
        const { status, notes } = req.body;

        const userId = validateUser(req, res);

        if (!userId) return;

        if (!isValidId(req.params.attendanceId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid attendance ID",
            });
        }

        if (status === undefined && notes === undefined) {
            return res.status(400).json({
                success: false,
                message: "Provide status or notes to update",
            });
        }

        if (
            status !== undefined &&
            !STUDENT_STATUSES.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Students can only mark Present, Absent or Class Off",
            });
        }

        if (
            notes !== undefined &&
            (typeof notes !== "string" || notes.length > 500)
        ) {
            return res.status(400).json({
                success: false,
                message: "Notes must not exceed 500 characters",
            });
        }

        const attendance = await Attendance.findOne({
            _id: req.params.attendanceId,
            student: userId,
        });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found",
            });
        }

        const classDateString = attendance.classDate
            .toISOString()
            .slice(0, 10);



        const semesterCheck = await getValidSemester(
            attendance.semester,
            userId
        );



        if (!semesterCheck.valid) {
            return res.status(semesterCheck.statusCode).json({
                success: false,
                message: semesterCheck.message,
            });
        }


        const dateCheck = validateClassDate(
            classDateString,
            semesterCheck.semester
        );

        if (!dateCheck.valid) {
            return res.status(400).json({
                success: false,
                message: dateCheck.message,
            });
        }


        const timetable = await Timetable.findOne({
            _id: attendance.timetable,
            student: userId,
            semester: attendance.semester,
            status: "active",
            entryType: "lecture",
        });

        if (!timetable) {
            return res.status(404).json({
                success: false,
                message: "Lecture not found",
            });
        }

        const windowCheck = validateLectureWindow(
            timetable,
            classDateString
        );

        if (!windowCheck.valid) {
            return res.status(400).json({
                success: false,
                message: windowCheck.message,
            });
        }

        if (status !== undefined) {
            attendance.status = status;
        }

        if (notes !== undefined) {
            attendance.notes = notes.trim();
        }

        attendance.markedBy = userId;
        attendance.markedAt = new Date();

        await attendance.save();

        const record = await populateAttendance(
            Attendance.findById(attendance._id)
        );

        return res.status(200).json({
            success: true,
            message: "Attendance updated successfully",
            attendance: record,
        });
    } catch (error) {
        console.error("Update attendance error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update attendance",
            error: error.message,
        });
    }
};

// ==========================================
// GET SEMESTER ATTENDANCE SUMMARY
// GET /api/attendance/summary/:semesterId
// ==========================================

const getAttendanceSummary = async (req, res) => {
    try {
        const { semesterId } = req.params;

        const userId = validateUser(req, res);

        if (!userId) return;

        if (!isValidId(semesterId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid semester ID",
            });
        }

        const semester = await Semester.findOne({
            _id: semesterId,
            student: userId,
        });

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: "Semester not found",
            });
        }

        const result = await Attendance.aggregate([
            {
                $match: {
                    student: new mongoose.Types.ObjectId(userId),
                    semester: new mongoose.Types.ObjectId(semesterId),
                },
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        const counts = {
            present: 0,
            absent: 0,
            lecture_off: 0,
        };

        result.forEach((item) => {
            counts[item._id] = item.count;
        });

        const conductedLectures =
            counts.present + counts.absent;

        const percentage =
            conductedLectures > 0
                ? Number(
                    (
                        (counts.present / conductedLectures) *
                        100
                    ).toFixed(2)
                )
                : 0;

        return res.status(200).json({
            success: true,
            summary: {
                present: counts.present,
                absent: counts.absent,
                lectureOff: counts.lecture_off,
                conductedLectures,
                totalRecordedEntries:
                    conductedLectures + counts.lecture_off,
                attendancePercentage: percentage,
            },
        });
    } catch (error) {
        console.error("Attendance summary error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to calculate attendance summary",
            error: error.message,
        });
    }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    markAttendance,
    markBulkAttendance,
    getSemesterAttendance,
    updateAttendance,
    getAttendanceSummary,
};
