
const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema(
    {
        // Logged-in student
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Institution
        institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: true,
        },

        // Academic Program
        academicProgram: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicProgram",
            required: true,
        },

        // Department
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null,
        },

        // Semester
        semester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Semester",
            required: true,
        },

        // Entry Type: Lecture or Break
        entryType: {
            type: String,
            enum: ["lecture", "break"],
            default: "lecture",
            required: true,
        },

        // Day of Week
        dayOfWeek: {
            type: String,
            enum: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
            ],
            required: true,
        },

        // Subject is required only for lectures
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            default: null,
            required: function () {
                return this.entryType === "lecture";
            },
        },

        // Lecture / Break Start Time
        startTime: {
            type: String,
            required: true,
            match: [
                /^([01]\d|2[0-3]):[0-5]\d$/,
                "Invalid start time format",
            ],
        },

        // Lecture / Break End Time
        endTime: {
            type: String,
            required: true,
            match: [
                /^([01]\d|2[0-3]):[0-5]\d$/,
                "Invalid end time format",
            ],
            validate: {
                validator: function (value) {
                    return !this.startTime || value > this.startTime;
                },
                message: "End time must be after start time",
            },
        },

        // Active / Archived
        status: {
            type: String,
            enum: ["active", "archived"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

// Student-wise timetable lookup
timetableSchema.index({
    student: 1,
    semester: 1,
    status: 1,
});

// Day-wise timetable lookup and sorting
timetableSchema.index({
    student: 1,
    semester: 1,
    dayOfWeek: 1,
    startTime: 1,
});

// Subject-wise lecture lookup
timetableSchema.index({
    student: 1,
    semester: 1,
    subject: 1,
});

// Export Model
module.exports = mongoose.model("Timetable", timetableSchema);
