
const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
    {
        // Logged-in student
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Current College / Institution
        institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: true,
        },

        // Current Course / Degree
        academicProgram: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicProgram",
            required: true,
            index: true,
        },

        // Current Branch
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null,
            index: true,
        },

        // Current Semester
        semester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Semester",
            required: true,
            index: true,
        },

        // Subject Name
        subjectName: {
            type: String,
            required: [true, "Subject name is required"],
            trim: true,
            maxlength: 150,
        },

        // Subject Code (Optional)
        subjectCode: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 30,
            default: null,
            set: (value) => {
                if (value === undefined || value === null || !String(value).trim()) {
                    return null;
                }

                return String(value).trim().toUpperCase();
            },
        },

        // Subject Teacher
        teacherName: {
            type: String,
            required: [true, "Teacher name is required"],
            trim: true,
            maxlength: 150,
        },

        // Active / Archived
        status: {
            type: String,
            enum: ["active", "archived"],
            default: "active",
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Subject code must be unique within the same semester.
// Multiple subjects can have null subject codes.
subjectSchema.index(
    {
        semester: 1,
        subjectCode: 1,
    },
    {
        unique: true,
        partialFilterExpression: {
            subjectCode: { $type: "string" },
        },
    }
);

// Efficient student-wise subject lookup
subjectSchema.index({
    student: 1,
    semester: 1,
    status: 1,
});

subjectSchema.index({
    student: 1,
    department: 1,
    semester: 1,
});

module.exports = mongoose.model("Subject", subjectSchema);
