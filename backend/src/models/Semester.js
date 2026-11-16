
const mongoose = require("mongoose");

const semesterSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: true,
        },

        academicProgram: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicProgram",
            required: true,
        },

        // Optional: Branch-based courses ke liye Department
        // BCA jaise courses mein department null rahega
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null,
        },

        semesterNumber: {
            type: Number,
            required: true,
            min: 1,
            max: 20,
        },

        yearNumber: {
            type: Number,
            required: true,
            min: 1,
            max: 10,
        },

        semesterName: {
            type: String,
            trim: true,
            default: "",
            maxlength: 100,
        },

        academicYear: {
            type: String,
            required: true,
            trim: true,
            maxlength: 30,
        },

        startDate: {
            type: Date,
            default: null,
        },

        endDate: {
            type: Date,
            default: null,
        },

        attendanceTarget: {
            type: Number,
            min: 1,
            max: 100,
            default: null,
        },

        status: {
            type: String,
            enum: ["upcoming", "current", "completed"],
            default: "upcoming",
        },

        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// ==========================================
// 1. Branch-based course semester uniqueness
// ==========================================

// Same department mein duplicate semester number allowed nahi hoga
semesterSchema.index(
    {
        department: 1,
        semesterNumber: 1,
    },
    {
        unique: true,
        partialFilterExpression: {
            department: { $type: "objectId" },
        },
    }
);

// ==========================================
// 2. Non-branch course semester uniqueness
// ==========================================

// Department ke bina same course mein duplicate semester allowed nahi hoga
semesterSchema.index(
    {
        academicProgram: 1,
        semesterNumber: 1,
    },
    {
        unique: true,
        partialFilterExpression: {
            department: { $type: "null" },
        },
    }
);

// ==========================================
// 3. Only one current semester per department
// ==========================================

semesterSchema.index(
    {
        department: 1,
    },
    {
        unique: true,
        partialFilterExpression: {
            department: { $type: "objectId" },
            status: "current",
        },
    }
);

// ==========================================
// 4. Only one current semester per non-branch course
// ==========================================

semesterSchema.index(
    {
        academicProgram: 1,
    },
    {
        unique: true,
        partialFilterExpression: {
            department: { $type: "null" },
            status: "current",
        },
    }
);

// ==========================================
// 5. Student-wise semester lookup
// ==========================================

semesterSchema.index({
    student: 1,
    institution: 1,
    academicProgram: 1,
    department: 1,
});

module.exports = mongoose.model("Semester", semesterSchema);
