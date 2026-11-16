import { useState } from "react";
import {
  GraduationCap,
  Building2,
  MapPin,
  CalendarDays,
  Check,
  School,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

import AcademicProgramStep from "../../components/setup/AcademicProgramStep";
import SemesterStep from "../../components/setup/SemesterStep";

const Setup = () => {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Institution Details
    institutionName: "",
    institutionType: "college",
    universityName: "",
    department: "",
    campus: "",
    city: "",
    state: "",
    country: "India",
    startDate: "",

    // Academic Program Details
    programName: "",
    degree: "",
    course: "",
    programDepartment: "",
    specialization: "",
    batchStartYear: "",
    batchEndYear: "",
    totalSemesters: "",
    academicYear: "",
    attendanceTarget: 75,

    // First Semester Details
    semesterNumber: "1",
    semesterName: "First Semester",
    semesterAcademicYear: "",
    semesterStartDate: "",
    semesterEndDate: "",
    semesterAttendanceTarget: 75,
  });

  const [errors, setErrors] = useState({});

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // Validate Institution
  const validateInstitution = () => {
    const newErrors = {};

    if (!formData.institutionName.trim()) {
      newErrors.institutionName = "Institution name is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Institution Next
  const handleInstitutionNext = (e) => {
    e.preventDefault();

    if (!validateInstitution()) return;

    setCurrentStep(2);
  };

  const handleCompleteSetup = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 1. Create Institution
      const institutionResponse = await api.post("/institutions", {
        institutionName: formData.institutionName.trim(),
        institutionType: formData.institutionType,
        universityName: formData.universityName.trim(),
        department: formData.department.trim(),
        campus: formData.campus.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        startDate: formData.startDate || undefined,
      });

      const institutionId = institutionResponse.data.institution?._id;

      if (!institutionId) {
        throw new Error("Institution creation failed. ID not received.");
      }

      toast.success("Institution created successfully!");

      // 2. Create Academic Program
      const programResponse = await api.post("/academic-programs", {
        institution: institutionId,
        programName: formData.programName.trim(),
        degree: formData.degree,
        course: formData.course,
        department: formData.programDepartment,
        specialization: formData.specialization,
        batchStartYear: Number(formData.batchStartYear),
        batchEndYear: Number(formData.batchEndYear),
        totalSemesters: Number(formData.totalSemesters),
        academicYear: formData.academicYear || undefined,
        attendanceTarget: Number(formData.attendanceTarget),
      });

      const program =
        programResponse.data.academicProgram || programResponse.data.program;

      const programId = program?._id;

      if (!programId) {
        throw new Error("Academic program creation failed. ID not received.");
      }

      toast.success("Academic program created successfully!");

      // 3. Create First Semester
      const semesterResponse = await api.post("/semesters", {
        academicProgram: programId,
        semesterNumber: Number(formData.semesterNumber),
        semesterName: formData.semesterName.trim(),
        academicYear: formData.semesterAcademicYear || formData.academicYear,
        startDate: formData.semesterStartDate,
        endDate: formData.semesterEndDate,
        attendanceTarget: Number(formData.semesterAttendanceTarget),
      });

      const semester = semesterResponse.data.semester;
      const semesterId = semester?._id;

      if (!semesterId) {
        throw new Error("Semester creation failed. ID not received.");
      }

      toast.success("First semester created successfully!");

      // 4. Complete Initial Setup
      await api.post("/setup/complete", {
        institutionId,
        programId,
        semesterId,
      });

      toast.success("Your academic profile is ready!");

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Setup Submission Error:", error);

      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to complete setup. Please try again.";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Progress Steps
  const steps = [
    {
      number: 1,
      title: "Institution",
      description: "College details",
    },
    {
      number: 2,
      title: "Program",
      description: "Academic details",
    },
    {
      number: 3,
      title: "Semester",
      description: "Semester details",
    },
    {
      number: 4,
      title: "Review",
      description: "Confirm details",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      {/* Header */}
      <div className="mx-auto mb-8 flex max-w-6xl items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
          <GraduationCap size={25} className="text-white" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900">SmartAttend</h1>

          <p className="text-xs text-slate-500">Student Academic Management</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Welcome */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Let's set up your academic profile
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Complete these steps to personalize your SmartAttend experience.
          </p>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Progress Steps */}
          <div className="border-b border-slate-100 px-5 py-7 md:px-10">
            <div className="mx-auto flex max-w-3xl items-center">
              {steps.map((step, index) => {
                const isCompleted = currentStep > step.number;
                const isActive = currentStep === step.number;

                return (
                  <div
                    key={step.number}
                    className="flex flex-1 items-center last:flex-none"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                          isCompleted
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : isActive
                              ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                              : "border-slate-200 bg-white text-slate-400"
                        }`}
                      >
                        {isCompleted ? <Check size={18} /> : step.number}
                      </div>

                      <p
                        className={`mt-2 text-xs font-semibold ${
                          isActive || isCompleted
                            ? "text-indigo-600"
                            : "text-slate-400"
                        }`}
                      >
                        {step.title}
                      </p>

                      <p className="mt-0.5 hidden text-[10px] text-slate-400 sm:block">
                        {step.description}
                      </p>
                    </div>

                    {index !== steps.length - 1 && (
                      <div
                        className={`mx-2 mb-6 h-0.5 flex-1 ${
                          currentStep > step.number
                            ? "bg-indigo-600"
                            : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-5 md:p-10">
            {/* STEP 1: INSTITUTION DETAILS */}
            {currentStep === 1 && (
              <>
                <div className="mb-7">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Building2 size={24} />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    Institution Details
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Tell us about your college or university.
                  </p>
                </div>

                <form onSubmit={handleInstitutionNext} className="space-y-6">
                  {/* Institution Name */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Institution Name *
                    </label>

                    <input
                      type="text"
                      name="institutionName"
                      value={formData.institutionName}
                      onChange={handleChange}
                      placeholder="Enter college or university name"
                      className={inputClass}
                    />

                    {errors.institutionName && (
                      <p className="mt-1.5 text-xs font-medium text-red-500">
                        {errors.institutionName}
                      </p>
                    )}
                  </div>

                  {/* Institution Type */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Institution Type *
                    </label>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {["college", "university", "school", "other"].map(
                        (type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                institutionType: type,
                              }))
                            }
                            className={`rounded-xl border px-3 py-3 text-sm font-semibold capitalize transition ${
                              formData.institutionType === type
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                : "border-slate-200 text-slate-600 hover:border-indigo-300"
                            }`}
                          >
                            {type}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {/* University Name */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Affiliated University
                    </label>

                    <input
                      type="text"
                      name="universityName"
                      value={formData.universityName}
                      onChange={handleChange}
                      placeholder="Enter university name"
                      className={inputClass}
                    />
                  </div>

                  {/* Department and Campus */}
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Department
                      </label>

                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g. Computer Science"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Campus
                      </label>

                      <input
                        type="text"
                        name="campus"
                        value={formData.campus}
                        onChange={handleChange}
                        placeholder="Enter campus name"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="border-t border-slate-100 pt-6">
                    <div className="mb-4 flex items-center gap-2">
                      <MapPin size={18} className="text-indigo-600" />

                      <h4 className="text-sm font-bold text-slate-800">
                        Institution Location
                      </h4>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          City
                        </label>

                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Enter city"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          State
                        </label>

                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="Enter state"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Country
                        </label>

                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Joining Date */}
                  <div className="border-t border-slate-100 pt-6">
                    <div className="mb-3 flex items-center gap-2">
                      <CalendarDays size={18} className="text-indigo-600" />

                      <label className="text-sm font-bold text-slate-800">
                        Institution Joining Date
                      </label>
                    </div>

                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end border-t border-slate-100 pt-6">
                    <button
                      type="submit"
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98]"
                    >
                      Continue
                      <span className="sr-only">to Academic Program</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* STEP 2: ACADEMIC PROGRAM */}
            {currentStep === 2 && (
              <AcademicProgramStep
                formData={formData}
                setFormData={setFormData}
                onBack={() => setCurrentStep(1)}
                onNext={() => setCurrentStep(3)}
              />
            )}

            {/* STEP 3: FIRST SEMESTER */}
            {currentStep === 3 && (
              <SemesterStep
                formData={formData}
                setFormData={setFormData}
                onBack={() => setCurrentStep(2)}
                onNext={() => setCurrentStep(4)}
              />
            )}

            {/* STEP 4: REVIEW */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                    <ClipboardCheck size={24} />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    Review Your Academic Profile
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Review the information you entered before completing setup.
                  </p>
                </div>

                {/* Institution Review */}
                <div className="rounded-xl border border-slate-200 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">
                      Institution Details
                    </h4>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <ReviewItem
                      label="Institution"
                      value={formData.institutionName}
                    />

                    <ReviewItem
                      label="Institution Type"
                      value={formData.institutionType}
                    />

                    <ReviewItem
                      label="University"
                      value={formData.universityName}
                    />

                    <ReviewItem
                      label="Department"
                      value={formData.department}
                    />

                    <ReviewItem label="Campus" value={formData.campus} />

                    <ReviewItem label="City" value={formData.city} />

                    <ReviewItem label="State" value={formData.state} />

                    <ReviewItem label="Country" value={formData.country} />

                    <ReviewItem
                      label="Joining Date"
                      value={formData.startDate}
                    />
                  </div>
                </div>

                {/* Academic Program Review */}
                <div className="rounded-xl border border-slate-200 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">
                      Academic Program
                    </h4>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <ReviewItem label="Program" value={formData.programName} />

                    <ReviewItem label="Degree" value={formData.degree} />

                    <ReviewItem label="Course" value={formData.course} />

                    <ReviewItem
                      label="Department"
                      value={formData.programDepartment}
                    />

                    <ReviewItem
                      label="Specialization"
                      value={formData.specialization}
                    />

                    <ReviewItem
                      label="Batch"
                      value={
                        formData.batchStartYear && formData.batchEndYear
                          ? `${formData.batchStartYear} - ${formData.batchEndYear}`
                          : ""
                      }
                    />

                    <ReviewItem
                      label="Total Semesters"
                      value={formData.totalSemesters}
                    />

                    <ReviewItem
                      label="Attendance Target"
                      value={`${formData.attendanceTarget}%`}
                    />
                  </div>
                </div>

                {/* Semester Review */}
                <div className="rounded-xl border border-slate-200 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">First Semester</h4>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <ReviewItem
                      label="Semester Number"
                      value={formData.semesterNumber}
                    />

                    <ReviewItem
                      label="Semester Name"
                      value={formData.semesterName}
                    />

                    <ReviewItem
                      label="Academic Year"
                      value={
                        formData.semesterAcademicYear || formData.academicYear
                      }
                    />

                    <ReviewItem
                      label="Start Date"
                      value={formData.semesterStartDate}
                    />

                    <ReviewItem
                      label="End Date"
                      value={formData.semesterEndDate}
                    />

                    <ReviewItem
                      label="Attendance Target"
                      value={`${formData.semesterAttendanceTarget}%`}
                    />
                  </div>
                </div>

                {/* Information */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-sm font-semibold text-indigo-900">
                    Almost there!
                  </p>

                  <p className="mt-1 text-xs leading-5 text-indigo-700">
                    Your academic profile is ready for review. The final
                    submission and database integration will be implemented
                    next.
                  </p>
                </div>

                <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={isSubmitting}
                    className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteSetup}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Setting up your profile...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <Check size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-xs text-slate-400">
          <School size={13} className="mr-1 inline" />
          Your academic information stays connected to your student account.
        </p>
      </div>
    </div>
  );
};

// Reusable Review Item
const ReviewItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-slate-400">{label}</p>

    <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
      {value || "Not provided"}
    </p>
  </div>
);

export default Setup;
