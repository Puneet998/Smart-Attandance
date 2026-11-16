
const express = require("express");

const {
    completeInitialSetup,
} = require("../controllers/setupController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Authentication required
router.use(protect);

// Complete initial academic setup
router.post("/complete", completeInitialSetup);

module.exports = router;
