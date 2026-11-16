
const mongoose = require("mongoose");

const Attendance = require("../models/Attendance");
const Semester = require("../models/Semester");
const Subject = require("../models/Subject");

// Default attendance target
const DEFAULT_TARGET_PERCENTAGE = 75;

// Validate MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==========================================
// CALCULATE ATTENDANCE PERCENTAGE
// Class Off is excluded
// ==========================================

const calculatePercentage = (present, absent) => {
    const conducted = present + absent;

    if (conducted === 0) return 0;

    return Number(
        ((present / conducted) * 100).toFixed(2)
    );
};

// ==========================================
// REQUIRED LECTURES TO REACH TARGET
// ==========================================

const calculateRequiredLectures = (
    present,
    absent,
    target
) => {
    const conducted = present + absent;

    // No attendance records yet.
    // Attending the first lecture gives 100%.
    if (conducted === 0) return 1;

    const currentPercentage = calculatePercentage(
        present,
        absent
    );

    if (currentPercentage >= target) return 0;

    // If target is 100 and an absence already exists,
    // reaching 100% is mathematically impossible.
    if (target === 100) return null;

    const targetRatio = target / 100;

    const required = Math.ceil(
        (
            targetRatio * conducted - present
        ) / (1 - targetRatio)
    );

    return Math.max(0, required);
};

// ==========================================
// SAFE ABSENCES
// How many upcoming lectures can be missed
// while maintaining the target?
// ==========================================

const calculateSafeAbsences = (
    present,
    absent,
    target
) => {
    const conducted = present + absent;

    if (conducted === 0) return 0;

    const currentPercentage = calculatePercentage(
        present,
        absent
    );

    if (currentPercentage < target) return 0;

    const targetRatio = target / 100;

    return Math.max(
        0,
        Math.floor(
            (present / targetRatio) - conducted + 1e-9
        )
    );
};

// ==========================================
// GET COMPLETE SEMESTER REPORT
// GET /api/reports/semester/:semesterId
// ==========================================

const getSemesterReport = async (req, res) => {
    try {
        const { semesterId } = req.params;

        const userId = req.user?.id || req.user?._id;

        // ======================================
        // AUTHENTICATION VALIDATION
        // ======================================

        if (!userId || !isValidId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
            });
        }

        // ======================================
        // SEMESTER ID VALIDATION
        // ======================================

        if (!isValidId(semesterId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid semester ID",
            });
        }

        // ======================================
        // TARGET VALIDATION
        // ======================================

        const target = Number(
            req.query.target ?? DEFAULT_TARGET_PERCENTAGE
        );

        if (
            !Number.isFinite(target) ||
            target <= 0 ||
            target > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Target attendance must be greater than 0 and at most 100",
            });
        }

        // ======================================
        // VERIFY SEMESTER OWNERSHIP
        // ======================================

        const semester = await Semester.findOne({
            _id: semesterId,
            student: userId,
        }).lean();

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: "Semester not found",
            });
        }

        // ======================================
        // FETCH ALL ACTIVE SUBJECTS
        // ======================================

        // Fetching subjects separately ensures that
        // subjects with zero attendance are also shown.

        const subjects = await Subject.find({
            student: userId,
            semester: semester._id,
            status: "active",
        })
            .select(
                "subjectName subjectCode teacherName"
            )
            .sort({ subjectName: 1 })
            .lean();

        // ======================================
        // GROUP ATTENDANCE SUBJECT-WISE
        // ======================================

        const groupedAttendance = await Attendance.aggregate([
            {
                $match: {
                    student: new mongoose.Types.ObjectId(
                        String(userId)
                    ),
                    semester: semester._id,
                },
            },
            {
                $group: {
                    _id: {
                        subject: "$subject",
                        status: "$status",
                    },
                    count: {
                        $sum: 1,
                    },
                },
            },
        ]);

        // ======================================
        // PREPARE SUBJECT COUNT MAP
        // ======================================

        const countsBySubject = new Map();

        groupedAttendance.forEach((item) => {
            const subjectId = String(
                item._id.subject
            );

            if (!countsBySubject.has(subjectId)) {
                countsBySubject.set(subjectId, {
                    present: 0,
                    absent: 0,
                    lectureOff: 0,
                });
            }

            const counts = countsBySubject.get(
                subjectId
            );

            if (item._id.status === "present") {
                counts.present = item.count;
            }

            if (item._id.status === "absent") {
                counts.absent = item.count;
            }

            if (item._id.status === "lecture_off") {
                counts.lectureOff = item.count;
            }
        });

        // ======================================
        // FETCH MISSED LECTURE DETAILS
        // ======================================

        const absentRecords = await Attendance.find({
            student: userId,
            semester: semester._id,
            status: "absent",
        })
            .select(
                "subject timetable classDate classStartTime classEndTime"
            )
            .populate(
                "timetable",
                "dayOfWeek startTime endTime"
            )
            .sort({
                classDate: -1,
                classStartTime: 1,
            })
            .lean();

        const missedBySubject = new Map();

        absentRecords.forEach((record) => {
            const subjectId = String(
                record.subject
            );

            if (!missedBySubject.has(subjectId)) {
                missedBySubject.set(subjectId, []);
            }

            missedBySubject.get(subjectId).push({
                attendanceId: record._id,

                classDate: record.classDate,

                dayOfWeek:
                    record.timetable?.dayOfWeek || null,

                startTime:
                    record.classStartTime ||
                    record.timetable?.startTime ||
                    null,

                endTime:
                    record.classEndTime ||
                    record.timetable?.endTime ||
                    null,
            });
        });

        // ======================================
        // GENERATE SUBJECT-WISE REPORT
        // ======================================

        const subjectReports = subjects.map((subject) => {
            const subjectId = String(subject._id);

            const counts =
                countsBySubject.get(subjectId) || {
                    present: 0,
                    absent: 0,
                    lectureOff: 0,
                };

            const present = counts.present;
            const absent = counts.absent;
            const lectureOff = counts.lectureOff;

            // Class Off is excluded from percentage.
            const conductedLectures = present + absent;

            const attendancePercentage =
                calculatePercentage(
                    present,
                    absent
                );

            const isTargetAchieved =
                conductedLectures > 0 &&
                attendancePercentage >= target;

            const requiredLectures =
                calculateRequiredLectures(
                    present,
                    absent,
                    target
                );

            const safeAbsences =
                calculateSafeAbsences(
                    present,
                    absent,
                    target
                );

            let status = "no_records";

            if (conductedLectures > 0) {
                status = isTargetAchieved
                    ? "target_achieved"
                    : "below_target";
            }

            return {
                subjectId: subject._id,

                subjectName: subject.subjectName,

                subjectCode:
                    subject.subjectCode || "",

                teacherName:
                    subject.teacherName || "",

                // Attendance counts
                present,
                absent,
                lectureOff,

                // Present + Absent only
                conductedLectures,

                // Includes Class Off separately
                totalRecordedEntries:
                    conductedLectures + lectureOff,

                // Percentage and target
                attendancePercentage,
                targetPercentage: target,
                isTargetAchieved,

                // Improvement guidance
                requiredLectures,
                safeAbsences,

                // Exact missed lecture information
                missedLectures:
                    missedBySubject.get(subjectId) || [],

                status,
            };
        });

        // ======================================
        // OVERALL SEMESTER SUMMARY
        // ======================================

        const summary = subjectReports.reduce(
            (acc, subject) => {
                acc.present += subject.present;
                acc.absent += subject.absent;
                acc.lectureOff += subject.lectureOff;

                return acc;
            },
            {
                present: 0,
                absent: 0,
                lectureOff: 0,
            }
        );

        summary.conductedLectures =
            summary.present + summary.absent;

        summary.totalRecordedEntries =
            summary.conductedLectures +
            summary.lectureOff;

        summary.attendancePercentage =
            calculatePercentage(
                summary.present,
                summary.absent
            );

        summary.targetPercentage = target;

        summary.isTargetAchieved =
            summary.conductedLectures > 0 &&
            summary.attendancePercentage >= target;

        summary.requiredLectures =
            calculateRequiredLectures(
                summary.present,
                summary.absent,
                target
            );

        summary.safeAbsences =
            calculateSafeAbsences(
                summary.present,
                summary.absent,
                target
            );

        // ======================================
        // SUBJECT STATUS COUNTS
        // ======================================

        const belowTargetSubjects =
            subjectReports.filter(
                (subject) =>
                    subject.status === "below_target"
            );

        const achievedSubjects =
            subjectReports.filter(
                (subject) =>
                    subject.status === "target_achieved"
            );

        const noRecordSubjects =
            subjectReports.filter(
                (subject) =>
                    subject.status === "no_records"
            );

        // ======================================
        // SUCCESS RESPONSE
        // ======================================

        return res.status(200).json({
            success: true,

            message:
                "Attendance report fetched successfully",

            semester: {
                id: semester._id,

                semesterName:
                    semester.semesterName,

                semesterNumber:
                    semester.semesterNumber,

                academicYear:
                    semester.academicYear,

                startDate:
                    semester.startDate,

                endDate:
                    semester.endDate,
            },

            targetPercentage: target,

            summary: {
                ...summary,

                totalSubjects:
                    subjectReports.length,

                subjectsBelowTarget:
                    belowTargetSubjects.length,

                subjectsTargetAchieved:
                    achievedSubjects.length,

                subjectsWithoutRecords:
                    noRecordSubjects.length,
            },

            subjectReports,
        });

    } catch (error) {
        console.error(
            "Semester attendance report error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to generate attendance report",

            error: error.message,
        });
    }
};

module.exports = {
    getSemesterReport,
};
