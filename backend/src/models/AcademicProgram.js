
const mongoose = require("mongoose");

const academicProgramSchema = new mongoose.Schema(
    {
        // Student who owns this academic program
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Institution to which this course belongs
        institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: true,
            index: true,
        },

        // Program name: Undergraduate, Postgraduate, Diploma etc.
        programName: {
            type: String,
            required: [true, "Program name is required"],
            trim: true,
            maxlength: 200,
        },

        // Degree: Bachelor, Master, Diploma etc.
        degree: {
            type: String,
            required: [true, "Degree is required"],
            trim: true,
            maxlength: 100,
        },

        // Course name: B.Tech, BCA, BBA, MBA etc.
        course: {
            type: String,
            required: [true, "Course name is required"],
            trim: true,
            maxlength: 150,
        },

        // Batch starting year
        batchStartYear: {
            type: Number,
            required: true,
            min: 1900,
            max: 2100,
        },

        // Batch ending year
        batchEndYear: {
            type: Number,
            required: true,
            min: 1900,
            max: 2100,
        },

        // Total semesters in this course
        totalSemesters: {
            type: Number,
            required: true,
            min: 1,
            max: 20,
        },

        // Current academic year
        academicYear: {
            type: String,
            trim: true,
            default: "",
            maxlength: 30,
        },

        // Attendance target percentage
        attendanceTarget: {
            type: Number,
            default: 75,
            min: 1,
            max: 100,
        },

        // Course status
        status: {
            type: String,
            enum: ["active", "completed", "discontinued", "transferred"],
            default: "active",
        },

        // Current selected course
        isCurrent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Student-wise institution and course lookup
academicProgramSchema.index({
    student: 1,
    institution: 1,
});

module.exports = mongoose.model(
    "AcademicProgram",
    academicProgramSchema
);
