const express = require("express");

const {
    register,
    login,
    logout,
    getMe,
    forgotPassword,
    resetPassword,
    updateProfile,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.post("/reset-password", resetPassword);
router.post("/forgot-password", forgotPassword);
router.put("/profile", protect, updateProfile)

module.exports = router;