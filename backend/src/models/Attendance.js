
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    // Student / Account Owner
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

    // Subject
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    // Timetable Lecture Entry
    timetable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timetable",
      required: true,
    },

    // Lecture Date (normalized to midnight)
    classDate: {
      type: Date,
      required: true,
    },

    // Lecture Start Time
    classStartTime: {
      type: String,
      required: true,
      match: [
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "Invalid start time",
      ],
    },

    // Lecture End Time
    classEndTime: {
      type: String,
      required: true,
      match: [
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "Invalid end time",
      ],
      validate: {
        validator: function (value) {
          return !this.classStartTime ||
            value > this.classStartTime;
        },
        message: "End time must be after start time",
      },
    },

    // Attendance Status
    status: {
      type: String,
      enum: ["present", "absent", "lecture_off"],
      required: true,
    },

    // Who marked the attendance
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Attendance marking time
    markedAt: {
      type: Date,
      default: Date.now,
    },

    // Additional Notes
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance for the same student,
// timetable lecture and date.
attendanceSchema.index(
  {
    student: 1,
    semester: 1,
    timetable: 1,
    classDate: 1,
  },
  {
    unique: true,
  }
);

// Subject-wise attendance history
attendanceSchema.index({
  student: 1,
  semester: 1,
  subject: 1,
  classDate: -1,
});

// Department-wise attendance lookup
attendanceSchema.index({
  student: 1,
  department: 1,
  semester: 1,
});

// Date-wise attendance lookup
attendanceSchema.index({
  student: 1,
  classDate: -1,
});

module.exports = mongoose.model("Attendance", attendanceSchema);
