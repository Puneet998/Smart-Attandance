
const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Semester = require("../models/Semester");

// ==========================================
// HELPER: VALIDATE OBJECT ID
// ==========================================

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==========================================
// HELPER: VALIDATE SUBJECT FIELDS
// ==========================================

const validateSubjectFields = ({ subjectName, teacherName }) => {
  if (
    typeof subjectName !== "string" ||
    !subjectName.trim()
  ) {
    return "Subject name is required";
  }

  if (
    typeof teacherName !== "string" ||
    !teacherName.trim()
  ) {
    return "Teacher name is required";
  }

  return null;
};

// ==========================================
// HELPER: CHECK SEMESTER OWNERSHIP
// ==========================================

const getOwnedSemester = async (semesterId, studentId) => {
  if (!isValidId(semesterId)) {
    return null;
  }

  return await Semester.findOne({
    _id: semesterId,
    student: studentId,
  });
};

// ==========================================
// CREATE SUBJECT
// POST /api/subjects
// ==========================================

const createSubject = async (req, res) => {
  try {
    const {
      semester,
      subjectName,
      subjectCode,
      teacherName,
    } = req.body;

    // Validate required fields
    const validationError = validateSubjectFields({
      subjectName,
      teacherName,
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    if (!semester) {
      return res.status(400).json({
        success: false,
        message: "Semester is required",
      });
    }

    // Verify semester belongs to logged-in student
    const semesterData = await getOwnedSemester(
      semester,
      req.user.id
    );

    if (!semesterData) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }

    // Subjects can only be added to upcoming/current semesters
    if (!["upcoming", "current"].includes(semesterData.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot add subjects to a completed semester",
      });
    }

    // Normalize optional subject code
    const normalizedCode = typeof subjectCode === "string" && subjectCode.trim()
      ? subjectCode.trim().toUpperCase()
      : null;

    // Create subject using verified semester details
    const subject = await Subject.create({
      student: req.user.id,
      institution: semesterData.institution,
      academicProgram: semesterData.academicProgram,
      department: semesterData.department || null,
      semester: semesterData._id,

      subjectName: subjectName.trim(),
      subjectCode: normalizedCode,
      teacherName: teacherName.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Subject added successfully",
      subject,
    });

  } catch (error) {
    console.error("Create Subject Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This subject code already exists in this semester",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create subject",
    });
  }
};

// ==========================================
// GET ALL SUBJECTS OF LOGGED-IN USER
// GET /api/subjects
// ==========================================

const getAllSubjects = async (req, res) => {
  try {
    const {
      semesterId,
      departmentId,
      academicProgramId,
      status = "active",
    } = req.query;

    const filter = {
      student: req.user.id,
    };

    // Optional semester filter
    if (semesterId) {
      if (!isValidId(semesterId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid semester ID",
        });
      }

      filter.semester = semesterId;
    }

    // Optional branch filter
    if (departmentId) {
      if (!isValidId(departmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID",
        });
      }

      filter.department = departmentId;
    }

    // Optional course filter
    if (academicProgramId) {
      if (!isValidId(academicProgramId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid academic program ID",
        });
      }

      filter.academicProgram = academicProgramId;
    }

    // Active subjects by default
    if (status !== "all") {
      if (!["active", "archived"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subject status",
        });
      }

      filter.status = status;
    }

    const subjects = await Subject.find(filter)
      .populate("institution", "institutionName")
      .populate("academicProgram", "programName")
      .populate("department", "departmentName departmentCode")
      .populate("semester", "semesterNumber semesterName academicYear")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: subjects.length,
      subjects,
    });

  } catch (error) {
    console.error("Get All Subjects Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subjects",
    });
  }
};

// ==========================================
// GET SUBJECTS OF A PARTICULAR SEMESTER
// GET /api/subjects/semester/:semesterId
// ==========================================

const getSemesterSubjects = async (req, res) => {
  try {
    const { semesterId } = req.params;

    if (!isValidId(semesterId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid semester ID",
      });
    }

    // Verify semester ownership
    const semester = await getOwnedSemester(
      semesterId,
      req.user.id
    );

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }

    const subjects = await Subject.find({
      student: req.user.id,
      semester: semester._id,
      status: "active",
    })
      .select(
        "subjectName subjectCode teacherName status createdAt updatedAt"
      )
      .sort({ subjectName: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: subjects.length,
      semester: {
        _id: semester._id,
        semesterName: semester.semesterName,
        semesterNumber: semester.semesterNumber,
        academicYear: semester.academicYear,
      },
      subjects,
    });

  } catch (error) {
    console.error("Get Semester Subjects Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch semester subjects",
    });
  }
};

// ==========================================
// GET SINGLE SUBJECT
// GET /api/subjects/:subjectId
// ==========================================

const getSubjectById = async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!isValidId(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    const subject = await Subject.findOne({
      _id: subjectId,
      student: req.user.id,
    })
      .populate("institution", "institutionName")
      .populate("academicProgram", "programName")
      .populate("department", "departmentName departmentCode")
      .populate("semester", "semesterNumber semesterName academicYear")
      .lean();

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      subject,
    });

  } catch (error) {
    console.error("Get Subject Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subject",
    });
  }
};

// ==========================================
// UPDATE SUBJECT
// PATCH /api/subjects/:subjectId
// ==========================================

const updateSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!isValidId(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    const subject = await Subject.findOne({
      _id: subjectId,
      student: req.user.id,
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Verify associated semester
    const semester = await getOwnedSemester(
      subject.semester,
      req.user.id
    );

    if (!semester || semester.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit subjects of a completed semester",
      });
    }

    const {
      subjectName,
      subjectCode,
      teacherName,
    } = req.body;

    // Validate only the fields being updated
    const updatedValues = {
      subjectName: subjectName !== undefined
        ? subjectName
        : subject.subjectName,

      teacherName: teacherName !== undefined
        ? teacherName
        : subject.teacherName,
    };

    const validationError = validateSubjectFields(updatedValues);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // Update subject name
    if (subjectName !== undefined) {
      subject.subjectName = subjectName.trim();
    }

    // Update teacher name
    if (teacherName !== undefined) {
      subject.teacherName = teacherName.trim();
    }

    // Update optional subject code
    if (subjectCode !== undefined) {
      subject.subjectCode = typeof subjectCode === "string" && subjectCode.trim()
        ? subjectCode.trim().toUpperCase()
        : null;
    }

    await subject.save();

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      subject,
    });

  } catch (error) {
    console.error("Update Subject Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This subject code already exists in this semester",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update subject",
    });
  }
};

// ==========================================
// DELETE / ARCHIVE SUBJECT
// DELETE /api/subjects/:subjectId
// ==========================================

const deleteSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!isValidId(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    const subject = await Subject.findOne({
      _id: subjectId,
      student: req.user.id,
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const semester = await getOwnedSemester(
      subject.semester,
      req.user.id
    );

    if (!semester || semester.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete subjects of a completed semester",
      });
    }

    subject.status = "archived";

    await subject.save();

    return res.status(200).json({
      success: true,
      message: "Subject archived successfully",
    });

  } catch (error) {
    console.error("Delete Subject Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to archive subject",
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  createSubject,
  getAllSubjects,
  getSemesterSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};
