
const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
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
            index: true,
        },

        academicProgram: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicProgram",
            required: true,
            index: true,
        },

        departmentName: {
            type: String,
            required: [true, "Department name is required"],
            trim: true,
            maxlength: 150,
        },

        departmentCode: {
            type: String,
            trim: true,
            uppercase: true,
            default: "",
            maxlength: 30,
        },

        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 500,
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },

        isCurrent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

departmentSchema.index({
    student: 1,
    institution: 1,
    academicProgram: 1,
});

module.exports = mongoose.model("Department", departmentSchema);
