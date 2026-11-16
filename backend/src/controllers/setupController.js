
const User = require("../models/User");
const Institution = require("../models/Institution");
const AcademicProgram = require("../models/AcademicProgram");
const Semester = require("../models/Semester");

// Complete initial academic setup
const completeInitialSetup = async (req, res) => {
  try {
    const { institutionId, programId, semesterId } = req.body;

    // Validate required IDs
    if (!institutionId || !programId || !semesterId) {
      return res.status(400).json({
        success: false,
        message: "Institution, academic program and semester are required",
      });
    }

    // Verify logged-in user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent repeated initial setup
    if (user.isSetupCompleted) {
      return res.status(400).json({
        success: false,
        message: "Initial setup is already completed",
      });
    }

    // Verify institution belongs to student
    const institution = await Institution.findOne({
      _id: institutionId,
      student: req.user.id,
    });

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: "Institution not found",
      });
    }

    // Verify academic program belongs to student and institution
    const program = await AcademicProgram.findOne({
      _id: programId,
      student: req.user.id,
      institution: institution._id,
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Academic program not found for this institution",
      });
    }

    // Verify first semester belongs to this program and institution
    const semester = await Semester.findOne({
      _id: semesterId,
      student: req.user.id,
      institution: institution._id,
      academicProgram: program._id,
      semesterNumber: 1,
      status: { $in: ["upcoming", "current"] },
    });

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: "Valid first semester not found for this academic program",
      });
    }

    // Mark initial setup as completed
    user.isSetupCompleted = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Initial academic setup completed successfully",
      isSetupCompleted: user.isSetupCompleted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  completeInitialSetup,
};
