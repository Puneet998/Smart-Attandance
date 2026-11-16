
const Institution = require("../models/Institution");
const AcademicProgram = require("../models/AcademicProgram");
const Semester = require("../models/Semester");
const Subject = require("../models/Subject");
const Timetable = require("../models/Timetable");
const Attendance = require("../models/Attendance");

const TIME_ZONE = "Asia/Kolkata";
const ATTENDANCE_TARGET = 75;

const getTodayDetails = () => {
    const now = new Date();

    const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);

    const day = new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        weekday: "long",
    }).format(now).toLowerCase();

    const start = new Date(`${date}T00:00:00.000+05:30`);
    const end = new Date(`${date}T23:59:59.999+05:30`);

    return { date, day, start, end };
};

const calculatePercentage = (present, absent) => {
    const total = present + absent;

    return total > 0
        ? Number(((present / total) * 100).toFixed(2))
        : 0;
};

const getDashboard = async (req, res) => {
    try {
        const studentId = req.user?.id || req.user?._id;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Student authentication required.",
            });
        }

        // 1. Current institution
        const institution = await Institution.findOne({
            student: studentId,
            isCurrent: true,
            status: "active",
        }).lean();

        if (!institution) {
            return res.status(200).json({
                success: true,
                setupRequired: true,
                message: "Please configure your current institution.",
                dashboard: null,
            });
        }

        // 2. Current academic program
        const program = await AcademicProgram.findOne({
            student: studentId,
            institution: institution._id,
            isCurrent: true,
            status: "active",
        }).lean();

        if (!program) {
            return res.status(200).json({
                success: true,
                setupRequired: true,
                message: "Please select your current academic program.",
                dashboard: {
                    institution,
                    program: null,
                    semester: null,
                },
            });
        }

        // 3. Current semester
        const semester = await Semester.findOne({
            student: studentId,
            academicProgram: program._id,
            status: "current",
        }).lean();

        if (!semester) {
            return res.status(200).json({
                success: true,
                setupRequired: false,
                message: "No current semester found.",
                dashboard: {
                    institution,
                    program,
                    semester: null,
                },
            });
        }

        // 4. Load subjects and today's timetable in parallel
        const { date, day, start, end } = getTodayDetails();

        const [subjects, todayTimetable] = await Promise.all([
            Subject.find({
                student: studentId,
                semester: semester._id,
                status: "active",
            })
                .select("subjectName subjectCode teacherName subjectType")
                .sort({ subjectName: 1 })
                .lean(),

            Timetable.find({
                student: studentId,
                semester: semester._id,
                status: "active",
                entryType: "lecture",
                dayOfWeek: day,
            })
                .populate(
                    "subject",
                    "subjectName subjectCode teacherName subjectType"
                )
                .sort({ startTime: 1 })
                .lean(),
        ]);

        // 5. Today's attendance
        const todayAttendance = await Attendance.find({
            student: studentId,
            semester: semester._id,
            classDate: {
                $gte: start,
                $lte: end,
            },
        })
            .select("timetable status")
            .lean();

        const attendanceMap = new Map(
            todayAttendance.map((record) => [
                String(record.timetable),
                record.status,
            ])
        );

        const todayLectures = todayTimetable.map((item) => ({
            _id: item._id,
            subject: item.subject || null,
            subjectName: item.subject?.subjectName || "Unknown Subject",
            subjectCode: item.subject?.subjectCode || "",
            teacherName: item.subject?.teacherName || "",
            startTime: item.startTime,
            endTime: item.endTime,
            room: item.room || "",
            entryType: item.entryType || "lecture",
            status: attendanceMap.get(String(item._id)) || "not_marked",
        }));

        // 6. Overall attendance summary
        const overallStats = await Attendance.aggregate([
            {
                $match: {
                    student: semester.student,
                    semester: semester._id,
                },
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        const summary = {
            totalClasses: 0,
            present: 0,
            absent: 0,
            classOff: 0,
            countedClasses: 0,
            attendancePercentage: 0,
        };

        overallStats.forEach((item) => {
            if (item._id === "present") summary.present = item.count;
            if (item._id === "absent") summary.absent = item.count;
            if (item._id === "lecture_off") summary.classOff = item.count;
        });

        summary.countedClasses = summary.present + summary.absent;
        summary.totalClasses =
            summary.countedClasses + summary.classOff;

        summary.attendancePercentage = calculatePercentage(
            summary.present,
            summary.absent
        );

        // 7. Subject-wise attendance
        const subjectStats = await Attendance.aggregate([
            {
                $match: {
                    student: semester.student,
                    semester: semester._id,
                },
            },
            {
                $group: {
                    _id: "$subject",
                    present: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "present"] }, 1, 0],
                        },
                    },
                    absent: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "absent"] }, 1, 0],
                        },
                    },
                    classOff: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "lecture_off"] }, 1, 0],
                        },
                    },
                },
            },
        ]);

        const subjectStatsMap = new Map(
            subjectStats.map((item) => [String(item._id), item])
        );

        const target = Number(
            semester.attendanceTarget || ATTENDANCE_TARGET
        );

        const subjectAttendance = subjects.map((subject) => {
            const stats = subjectStatsMap.get(String(subject._id));

            const present = stats?.present || 0;
            const absent = stats?.absent || 0;
            const classOff = stats?.classOff || 0;
            const counted = present + absent;

            const percentage = calculatePercentage(present, absent);

            return {
                subjectId: subject._id,
                subjectName: subject.subjectName,
                subjectCode: subject.subjectCode,
                teacherName: subject.teacherName || "",
                present,
                absent,
                classOff,
                totalClasses: counted + classOff,
                countedClasses: counted,
                attendancePercentage: percentage,
                attendanceTarget: target,
                isLowAttendance: counted > 0 && percentage < target,
                hasRecords: counted > 0,
            };
        });

        // 8. Dashboard response
        return res.status(200).json({
            success: true,
            message: "Dashboard data fetched successfully.",
            setupRequired: false,

            dashboard: {
                institution,
                program,
                semester,

                today: {
                    date,
                    day,
                    totalClasses: todayLectures.length,
                    lectures: todayLectures,
                },

                summary,

                totalSubjects: subjects.length,
                subjectAttendance,

                attendanceTarget: target,

                performance: {
                    subjectsBelowTarget: subjectAttendance.filter(
                        (item) => item.isLowAttendance
                    ).length,

                    subjectsAchievedTarget: subjectAttendance.filter(
                        (item) =>
                            item.hasRecords &&
                            item.attendancePercentage >= target
                    ).length,

                    subjectsWithoutRecords: subjectAttendance.filter(
                        (item) => !item.hasRecords
                    ).length,
                },
            },
        });
    } catch (error) {
        console.error("Dashboard Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load dashboard.",
            error: error.message,
        });
    }
};

module.exports = {
    getDashboard,
};
