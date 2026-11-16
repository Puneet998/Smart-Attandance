
const mongoose = require("mongoose");

const institutionSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        institutionName: {
            type: String,
            required: [true, "Institution name is required"],
            trim: true,
            maxlength: 200,
        },

        institutionType: {
            type: String,
            enum: ["college", "university", "school", "other"],
            default: "college",
        },

        universityName: {
            type: String,
            trim: true,
            default: "",
            maxlength: 200,
        },

        campus: {
            type: String,
            trim: true,
            default: "",
            maxlength: 200,
        },

        city: {
            type: String,
            trim: true,
            default: "",
            maxlength: 100,
        },

        state: {
            type: String,
            trim: true,
            default: "",
            maxlength: 100,
        },

        country: {
            type: String,
            trim: true,
            default: "India",
            maxlength: 100,
        },

        startDate: {
            type: Date,
            default: null,
        },

        endDate: {
            type: Date,
            default: null,
        },

        status: {
            type: String,
            enum: ["active", "completed", "transferred", "withdrawn"],
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

institutionSchema.index({
    student: 1,
    createdAt: -1,
});

module.exports = mongoose.model("Institution", institutionSchema);
