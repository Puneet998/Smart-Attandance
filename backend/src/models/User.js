
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: 3,
            maxlength: 100,
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 8,
            select: false,
        },

        role: {
            type: String,
            enum: ["student"],
            default: "student",
            immutable: true,
        },

        // Personal Profile
        phone: {
            type: String,
            trim: true,
            default: "",
            maxlength: 20,
        },

        dateOfBirth: {
            type: Date,
            default: null,
        },

        gender: {
            type: String,
            enum: ["male", "female", "other", "prefer_not_to_say", ""],
            default: "",
        },

        profilePhoto: {
            type: String,
            default: "",
        },

        address: {
            street: {
                type: String,
                trim: true,
                default: "",
            },
            city: {
                type: String,
                trim: true,
                default: "",
            },
            state: {
                type: String,
                trim: true,
                default: "",
            },
            postalCode: {
                type: String,
                trim: true,
                default: "",
            },
            country: {
                type: String,
                trim: true,
                default: "India",
            },
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        isSetupCompleted: {
            type: Boolean,
            default: false,
        },

        passwordResetToken: {
            type: String,
            select: false,
        },

        passwordResetExpires: {
            type: Date,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);
