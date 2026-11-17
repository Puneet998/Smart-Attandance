const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

const setTokenCookie = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

// REGISTER STUDENT
exports.register = async (req, res) => {
    try {
        const { name, email, password, acceptedTerms } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided",
            });
        }

        if (typeof acceptedTerms !== "boolean" || !acceptedTerms) {
            return res.status(400).json({
                success: false,
                message: "Please accept Terms and Conditions",
            });
        }

        if (name.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: "Name must contain at least 3 characters",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters",
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "student",
        });

        const token = generateToken(user._id);

        setTokenCookie(res, token);

        return res.status(201).json({
            success: true,
            message: "Student account created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isSetupCompleted: user.isSetupCompleted,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already registered",
            });
        }

        console.error("Register Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// LOGIN STUDENT
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = generateToken(user._id);

        setTokenCookie(res, token);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isSetupCompleted: user.isSetupCompleted,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// LOGOUT
exports.logout = (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        expires: new Date(0),
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};

// CURRENT USER
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Get Me Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};



// FORGOT PASSWORD

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email address is required",
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
        });

        const genericResponse = {
            success: true,
            message: "If an account exists with this email, a password reset link has been sent.",
        };

        if (!user) {
            return res.status(200).json(genericResponse);
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

        await user.save({ validateBeforeSave: false });

        const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #4f46e5;">SmartAttend Password Reset</h2>

                <p>Hello ${user.name},</p>

                <p>We received a request to reset your SmartAttend account password.</p>

                <p>Click the button below to create a new password:</p>

                <a href="${resetURL}"
                    style="display: inline-block; background: #4f46e5; color: white; padding: 13px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Reset Password
                </a>

                <p style="margin-top: 25px; color: #64748b;">
                    This link will expire in 10 minutes.
                </p>

                <p style="color: #64748b;">
                    If you did not request a password reset, you can safely ignore this email.
                </p>

                <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 25px;" />

                <p style="font-size: 12px; color: #94a3b8;">
                    SmartAttend Team
                </p>
            </div>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: "Reset Your SmartAttend Password",
                html,
            });
        } catch (emailError) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;

            await user.save({ validateBeforeSave: false });

            console.error("Password Reset Email Failed:", emailError);

            return res.status(200).json(genericResponse);
        }

        return res.status(200).json(genericResponse);

    } catch (error) {
        console.error("Forgot Password Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to process password reset request",
        });
    }
};


// RESET PASSWORD

exports.resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        // Validate required fields
        if (!token || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters",
            });
        }

        // Validate password confirmation
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        // Hash incoming reset token
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Find user with valid and unexpired token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        }).select("+passwordResetToken +passwordResetExpires");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset link",
            });
        }

        // Hash new password
        user.password = await bcrypt.hash(password, 12);

        // Invalidate reset token
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. Please login with your new password.",
        });

    } catch (error) {
        console.error("Reset Password Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to reset password. Please try again.",
        });
    }
};





// UPDATE STUDENT PROFILE
exports.updateProfile = async (req, res) => {
    try {
        const {
            name,
            phone,
            dateOfBirth,
            gender,
            address,
        } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Update name only when provided
        if (name !== undefined) {
            if (typeof name !== "string" || name.trim().length < 3) {
                return res.status(400).json({
                    success: false,
                    message: "Name must contain at least 3 characters",
                });
            }

            user.name = name.trim();
        }

        // Optional phone
        if (phone !== undefined) {
            user.phone = String(phone).trim();
        }

        // Optional date of birth
        if (dateOfBirth !== undefined) {
            if (!dateOfBirth) {
                user.dateOfBirth = null;
            } else {
                const parsedDate = new Date(dateOfBirth);

                if (Number.isNaN(parsedDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Please provide a valid date of birth",
                    });
                }

                user.dateOfBirth = parsedDate;
            }
        }

        // Optional gender
        if (gender !== undefined) {
            const allowedGenders = [
                "",
                "male",
                "female",
                "other",
                "prefer_not_to_say",
            ];

            if (!allowedGenders.includes(gender)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid gender value",
                });
            }

            user.gender = gender;
        }

        // Optional address fields
        if (address !== undefined) {
            if (
                !address ||
                typeof address !== "object" ||
                Array.isArray(address)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid address details",
                });
            }

            const allowedAddressFields = [
                "street",
                "city",
                "state",
                "postalCode",
                "country",
            ];

            allowedAddressFields.forEach((field) => {
                if (address[field] !== undefined) {
                    user.address[field] = String(address[field]).trim();
                }
            });
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user,
        });

    } catch (error) {
        console.error("Update Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update profile",
        });
    }
};
