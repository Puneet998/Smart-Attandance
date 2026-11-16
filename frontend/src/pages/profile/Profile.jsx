
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  GraduationCap,
  Building2,
  Pencil,
  X,
  ShieldCheck,
  Save,
  Globe,
  Plus,
  CheckCircle2,
  Star,
  Loader2,
  School,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Layers,
  Target,
  Network,
  Info,
  CircleUserRound,
  Settings2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import toast from "react-hot-toast";

const emptyInstitutionForm = {
  institutionName: "",
  institutionType: "college",
  universityName: "",
  campus: "",
  city: "",
  state: "",
  country: "India",
  startDate: "",
  endDate: "",
  isCurrent: false,
};

const emptyCourseForm = {
  programName: "",
  degree: "",
  course: "",
  batchStartYear: "",
  batchEndYear: "",
  totalSemesters: 8,
  academicYear: "",
  attendanceTarget: 75,
  isCurrent: false,
};

const emptyDepartmentForm = {
  departmentName: "",
  departmentCode: "",
  description: "",
  status: "active",
  isCurrent: false,
};

const getList = (response, keys = []) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data?.[key])) return data.data[key];
  }
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const dateValue = (value) => (value ? String(value).slice(0, 10) : "");

// Premium Neutral SaaS Tailwind Classes
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-500";

const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60";

const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60";

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
  optional = false,
  min,
  max,
  step,
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
        {optional && (
          <span className="ml-2 text-xs font-normal text-slate-400">
            Optional
          </span>
        )}
      </label>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={inputClass}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  optional = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
        {optional && (
          <span className="ml-2 text-xs font-normal text-slate-400">
            Optional
          </span>
        )}
      </label>
      <select
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-slate-200">
      <div className="rounded-lg bg-slate-50 p-2.5 text-slate-600">
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-slate-900">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, buttonText, onClick }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-5 py-14 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-600">
        <Icon size={28} />
      </div>
      <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
      <button onClick={onClick} className={`${buttonPrimary} mt-6`}>
        <Plus size={17} />
        {buttonText}
      </button>
    </div>
  );
}

function LoadingState({ message = "Loading..." }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-14 text-center shadow-sm">
      <Loader2 size={28} className="mx-auto animate-spin text-slate-800" />
      <p className="mt-3 text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}

function Modal({ title, description, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-5 sm:px-7">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ saving, onCancel, submitText }) {
  return (
    <div className="sticky bottom-0 -mx-5 -mb-5 mt-8 border-t border-slate-100 bg-white p-5 sm:-mx-7 sm:-mb-7 sm:p-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end z-10">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className={buttonSecondary}
      >
        Cancel
      </button>
      <button type="submit" disabled={saving} className={buttonPrimary}>
        {saving ? (
          <Loader2 size={17} className="animate-spin" />
        ) : (
          <Save size={17} />
        )}
        {saving ? "Saving..." : submitText}
      </button>
    </div>
  );
}

export default function Profile() {
  const { user, getMe } = useAuth();

  const [activeSection, setActiveSection] = useState("personal");

  // Personal profile
  const [profile, setProfile] = useState({});
  const [profileForm, setProfileForm] = useState({});
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Institutions
  const [institutions, setInstitutions] = useState([]);
  const [institutionLoading, setInstitutionLoading] = useState(true);
  const [institutionSaving, setInstitutionSaving] = useState(false);
  const [institutionModalOpen, setInstitutionModalOpen] = useState(false);
  const [editingInstitutionId, setEditingInstitutionId] = useState(null);
  const [institutionForm, setInstitutionForm] = useState({
    ...emptyInstitutionForm,
  });
  const [currentInstitutionChanging, setCurrentInstitutionChanging] =
    useState(null);

  // Courses
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [courses, setCourses] = useState([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseSaving, setCourseSaving] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseForm, setCourseForm] = useState({ ...emptyCourseForm });
  const [currentCourseChanging, setCurrentCourseChanging] = useState(null);

  // Departments
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [departmentSaving, setDepartmentSaving] = useState(false);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [departmentForm, setDepartmentForm] = useState({
    ...emptyDepartmentForm,
  });
  const [currentDepartmentChanging, setCurrentDepartmentChanging] =
    useState(null);

  // Global Active State for Header (Silently fetched)
  const [globalCurrentDepartment, setGlobalCurrentDepartment] = useState(null);
  const [globalCurrentCourse, setGlobalCurrentCourse] = useState(null);
  const [globalCurrentInstitution, setGlobalCurrentInstitution] =
    useState(null);

  // Semester manager
  const [semesterDepartmentId, setSemesterDepartmentId] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [semesterLoading, setSemesterLoading] = useState(false);
  const [semesterGenerating, setSemesterGenerating] = useState(false);
  const [semesterActionId, setSemesterActionId] = useState(null);
  const [semesterSetup, setSemesterSetup] = useState({
    id: "",
    startDate: "",
    endDate: "",
    attendanceTarget: 75,
  });

  useEffect(() => {
    setProfile({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      dateOfBirth: dateValue(user?.dateOfBirth),
      gender: user?.gender || "",
      street: user?.address?.street || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      postalCode: user?.address?.postalCode || "",
      country: user?.address?.country || "India",
    });
  }, [user]);

  // -----------------------------------------
  // LOAD DATA
  // -----------------------------------------

  const loadInstitutions = useCallback(async () => {
    try {
      setInstitutionLoading(true);
      const response = await api.get("/institutions");
      setInstitutions(getList(response, ["institutions"]));
    } catch (error) {
      console.error("Load institutions error:", error);
      toast.error(
        error.response?.data?.message || "Unable to load institutions",
      );
    } finally {
      setInstitutionLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInstitutions();
  }, [loadInstitutions]);

  const loadCourses = useCallback(async (institutionId) => {
    if (!institutionId) {
      setCourses([]);
      return;
    }
    try {
      setCourseLoading(true);
      const response = await api.get("/academic-programs", {
        params: { institution: institutionId },
      });
      setCourses(
        getList(response, ["academicPrograms", "programs", "courses"]),
      );
    } catch (error) {
      console.error("Load courses error:", error);
      toast.error(error.response?.data?.message || "Unable to load courses");
      setCourses([]);
    } finally {
      setCourseLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedInstitution?._id) {
      loadCourses(selectedInstitution._id);
    } else {
      setCourses([]);
    }
  }, [selectedInstitution, loadCourses]);

  const loadDepartments = useCallback(async (courseId) => {
    if (!courseId) {
      setDepartments([]);
      return;
    }
    try {
      setDepartmentLoading(true);
      const response = await api.get("/departments", {
        params: { academicProgram: courseId },
      });
      setDepartments(getList(response, ["departments"]));
    } catch (error) {
      console.error("Load departments error:", error);
      toast.error(
        error.response?.data?.message || "Unable to load departments",
      );
      setDepartments([]);
    } finally {
      setDepartmentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCourse?._id) {
      loadDepartments(selectedCourse._id);
    } else {
      setDepartments([]);
    }
  }, [selectedCourse, loadDepartments]);

  // Current academic selection is fetched independently so it is visible
  // immediately when Profile opens (without first opening Academic Information).
  const currentInstitution =
    institutions.find((item) => item.isCurrent) || null;
  const currentCourse = courses.find((item) => item.isCurrent) || null;

  useEffect(() => {
    let cancelled = false;
    const loadCurrentAcademicSummary = async () => {
      const institution = institutions.find((item) => item.isCurrent) || null;
      setGlobalCurrentInstitution(institution);
      setGlobalCurrentCourse(null);
      setGlobalCurrentDepartment(null);
      if (!institution?._id) return;
      try {
        const courseRes = await api.get("/academic-programs", {
          params: { institution: institution._id },
        });
        const programs = getList(courseRes, [
          "academicPrograms",
          "programs",
          "courses",
        ]);
        const course = programs.find((item) => item.isCurrent) || null;
        if (cancelled || !course) return;
        setGlobalCurrentCourse(course);
        const depRes = await api.get("/departments", {
          params: { academicProgram: course._id },
        });
        const deps = getList(depRes, ["departments"]);
        if (!cancelled)
          setGlobalCurrentDepartment(
            deps.find((item) => item.isCurrent) || null,
          );
      } catch (error) {
        console.error("Load current academic summary error:", error);
      }
    };
    if (!institutionLoading) loadCurrentAcademicSummary();
    return () => {
      cancelled = true;
    };
  }, [institutions, institutionLoading]);

  const loadSemesters = useCallback(async (programId, departmentId = "") => {
    if (!programId) {
      setSemesters([]);
      return;
    }
    try {
      setSemesterLoading(true);
      const response = await api.get(`/semesters/program/${programId}`, {
        params: departmentId ? { departmentId } : {},
      });
      setSemesters(getList(response, ["semesters"]));
    } catch (error) {
      console.error("Load semesters error:", error);
      toast.error(error.response?.data?.message || "Unable to load semesters");
      setSemesters([]);
    } finally {
      setSemesterLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      selectedCourse?._id &&
      departments.length > 0 &&
      !semesterDepartmentId
    ) {
      const currentBranch =
        departments.find((item) => item.isCurrent) || departments[0];
      if (currentBranch?._id) setSemesterDepartmentId(currentBranch._id);
    }
  }, [selectedCourse, departments, semesterDepartmentId]);

  useEffect(() => {
    if (selectedCourse?._id)
      loadSemesters(selectedCourse._id, semesterDepartmentId);
    else setSemesters([]);
  }, [selectedCourse, semesterDepartmentId, loadSemesters]);

  const generateSemesters = async () => {
    if (!selectedCourse?._id) return;
    if (departments.length > 0 && !semesterDepartmentId) {
      toast.error("Please select a department / branch first");
      return;
    }
    try {
      setSemesterGenerating(true);
      await api.post("/semesters/generate", {
        academicProgram: selectedCourse._id,
        ...(semesterDepartmentId ? { departmentId: semesterDepartmentId } : {}),
      });
      await loadSemesters(selectedCourse._id, semesterDepartmentId);
      toast.success("Semesters generated successfully");
    } catch (error) {
      console.error("Generate semesters error:", error);
      toast.error(
        error.response?.data?.message || "Unable to generate semesters",
      );
    } finally {
      setSemesterGenerating(false);
    }
  };

  const startSelectedSemester = async (event) => {
    event.preventDefault();
    if (!semesterSetup.id) return;
    if (
      !semesterSetup.startDate ||
      !semesterSetup.endDate ||
      semesterSetup.endDate < semesterSetup.startDate
    ) {
      toast.error("Please enter valid semester dates");
      return;
    }
    const target = Number(semesterSetup.attendanceTarget);
    if (!Number.isFinite(target) || target < 1 || target > 100) {
      toast.error("Attendance target must be between 1 and 100");
      return;
    }
    try {
      setSemesterActionId(semesterSetup.id);
      await api.patch(`/semesters/${semesterSetup.id}/start`, {
        startDate: semesterSetup.startDate,
        endDate: semesterSetup.endDate,
        attendanceTarget: target,
      });
      setSemesterSetup({
        id: "",
        startDate: "",
        endDate: "",
        attendanceTarget: 75,
      });
      await loadSemesters(selectedCourse._id, semesterDepartmentId);
      toast.success("Semester started successfully");
    } catch (error) {
      console.error("Start semester error:", error);
      toast.error(error.response?.data?.message || "Unable to start semester");
    } finally {
      setSemesterActionId(null);
    }
  };

  const completeSelectedSemester = async (semesterId) => {
    try {
      setSemesterActionId(semesterId);
      await api.patch(`/semesters/${semesterId}/complete`, {});
      await loadSemesters(selectedCourse._id, semesterDepartmentId);
      toast.success("Semester marked as completed");
    } catch (error) {
      console.error("Complete semester error:", error);
      toast.error(
        error.response?.data?.message || "Unable to complete semester",
      );
    } finally {
      setSemesterActionId(null);
    }
  };

  // -----------------------------------------
  // PERSONAL PROFILE
  // -----------------------------------------

  const openProfileModal = () => {
    setProfileForm({ ...profile });
    setProfileModalOpen(true);
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      setProfileSaving(true);
      const payload = {
        phone: profileForm.phone,
        dateOfBirth: profileForm.dateOfBirth || null,
        gender: profileForm.gender,
        address: {
          street: profileForm.street,
          city: profileForm.city,
          state: profileForm.state,
          postalCode: profileForm.postalCode,
          country: profileForm.country,
        },
      };
      await api.put("/auth/profile", payload);
      if (getMe) await getMe();
      setProfile({ ...profileForm });
      setProfileModalOpen(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error(error.response?.data?.message || "Unable to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  // -----------------------------------------
  // INSTITUTION ACTIONS
  // -----------------------------------------

  const openAddInstitution = () => {
    setEditingInstitutionId(null);
    setInstitutionForm({ ...emptyInstitutionForm });
    setInstitutionModalOpen(true);
  };

  const openEditInstitution = (institution) => {
    setEditingInstitutionId(institution._id);
    setInstitutionForm({
      institutionName: institution.institutionName || "",
      institutionType: institution.institutionType || "college",
      universityName: institution.universityName || "",
      campus: institution.campus || "",
      city: institution.city || "",
      state: institution.state || "",
      country: institution.country || "India",
      startDate: dateValue(institution.startDate),
      endDate: dateValue(institution.endDate),
      isCurrent: Boolean(institution.isCurrent),
    });
    setInstitutionModalOpen(true);
  };

  const handleInstitutionChange = (event) => {
    const { name, value, type, checked } = event.target;
    setInstitutionForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveInstitution = async (event) => {
    event.preventDefault();
    if (!institutionForm.institutionName.trim()) {
      toast.error("Please enter institution name");
      return;
    }
    if (
      institutionForm.startDate &&
      institutionForm.endDate &&
      institutionForm.endDate < institutionForm.startDate
    ) {
      toast.error("End date cannot be before start date");
      return;
    }
    try {
      setInstitutionSaving(true);
      const payload = {
        ...institutionForm,
        institutionName: institutionForm.institutionName.trim(),
        universityName: institutionForm.universityName.trim(),
        campus: institutionForm.campus.trim(),
        city: institutionForm.city.trim(),
        state: institutionForm.state.trim(),
        country: institutionForm.country.trim(),
      };
      let response;
      if (editingInstitutionId) {
        response = await api.patch(
          `/institutions/${editingInstitutionId}`,
          payload,
        );
      } else {
        response = await api.post("/institutions", payload);
      }
      const savedInstitution =
        response.data?.institution ||
        response.data?.data?.institution ||
        response.data?.data;

      if (payload.isCurrent && savedInstitution?._id) {
        await api.patch(
          `/institutions/${savedInstitution._id}/select-current`,
          {},
        );
      }
      setInstitutionModalOpen(false);
      setEditingInstitutionId(null);
      setInstitutionForm({ ...emptyInstitutionForm });
      await loadInstitutions();
      toast.success(
        editingInstitutionId ? "Institution updated" : "Institution added",
      );
    } catch (error) {
      console.error("Save institution error:", error);
      toast.error(
        error.response?.data?.message || "Unable to save institution",
      );
    } finally {
      setInstitutionSaving(false);
    }
  };

  const setCurrentInstitution = async (institutionId) => {
    try {
      setCurrentInstitutionChanging(institutionId);
      await api.patch(`/institutions/${institutionId}/select-current`, {});
      await loadInstitutions();
      toast.success("Current institution updated");
    } catch (error) {
      console.error("Set current institution error:", error);
      toast.error(
        error.response?.data?.message || "Unable to update institution",
      );
    } finally {
      setCurrentInstitutionChanging(null);
    }
  };

  // -----------------------------------------
  // COURSE ACTIONS
  // -----------------------------------------

  const openCourses = (institution) => {
    setSelectedInstitution(institution);
    setSelectedCourse(null);
    setDepartments([]);
  };

  const backToInstitutions = () => {
    setSelectedInstitution(null);
    setSelectedCourse(null);
    setCourses([]);
    setDepartments([]);
    setCourseModalOpen(false);
  };

  const openAddCourse = () => {
    setEditingCourseId(null);
    setCourseForm({ ...emptyCourseForm });
    setCourseModalOpen(true);
  };

  const openEditCourse = (course) => {
    setEditingCourseId(course._id);
    setCourseForm({
      programName: course.programName || "",
      degree: course.degree || "",
      course: course.course || "",
      batchStartYear: course.batchStartYear ?? "",
      batchEndYear: course.batchEndYear ?? "",
      totalSemesters: course.totalSemesters ?? 8,
      academicYear: course.academicYear || "",
      attendanceTarget: course.attendanceTarget ?? 75,
      isCurrent: Boolean(course.isCurrent),
    });
    setCourseModalOpen(true);
  };

  const handleCourseChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCourseForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveCourse = async (event) => {
    event.preventDefault();
    if (!selectedInstitution?._id) {
      toast.error("Please select an institution first");
      return;
    }
    const startYear = Number(courseForm.batchStartYear);
    const endYear = Number(courseForm.batchEndYear);
    const semesters = Number(courseForm.totalSemesters);
    const target = Number(courseForm.attendanceTarget);

    if (
      !courseForm.degree.trim() ||
      !courseForm.programName.trim() ||
      !courseForm.course.trim()
    ) {
      toast.error("Please enter degree, program name, and course name");
      return;
    }
    if (!startYear || !endYear || endYear < startYear) {
      toast.error("Please enter valid batch start and end years");
      return;
    }

    try {
      setCourseSaving(true);
      // Clean payload exactly mapped for Academic Information Separation
      const payload = {
        institution: selectedInstitution._id,
        programName: courseForm.programName.trim(),
        degree: courseForm.degree.trim(),
        course: courseForm.course.trim(), // Storing Actual Course (e.g., B.Tech)
        batchStartYear: startYear,
        batchEndYear: endYear,
        totalSemesters: semesters,
        academicYear: courseForm.academicYear.trim(),
        attendanceTarget: target,
        isCurrent: Boolean(courseForm.isCurrent),
      };

      let response;
      if (editingCourseId) {
        response = await api.patch(
          `/academic-programs/${editingCourseId}`,
          payload,
        );
      } else {
        response = await api.post("/academic-programs", payload);
      }

      const savedCourse =
        response.data?.academicProgram ||
        response.data?.program ||
        response.data?.data?.academicProgram ||
        response.data?.data?.program ||
        response.data?.data;
      if (payload.isCurrent && savedCourse?._id) {
        await api.patch(
          `/academic-programs/${savedCourse._id}/select-current`,
          {},
        );
      }

      setCourseModalOpen(false);
      setEditingCourseId(null);
      setCourseForm({ ...emptyCourseForm });
      await loadCourses(selectedInstitution._id);
      toast.success(editingCourseId ? "Course updated" : "Course added");
    } catch (error) {
      console.error("Save course error:", error);
      toast.error(error.response?.data?.message || "Unable to save course");
    } finally {
      setCourseSaving(false);
    }
  };

  const setCurrentCourse = async (courseId) => {
    try {
      setCurrentCourseChanging(courseId);
      await api.patch(`/academic-programs/${courseId}/select-current`, {});
      await loadCourses(selectedInstitution._id);
      toast.success("Current course updated");
    } catch (error) {
      console.error("Set current course error:", error);
      toast.error(error.response?.data?.message || "Unable to update course");
    } finally {
      setCurrentCourseChanging(null);
    }
  };

  // -----------------------------------------
  // DEPARTMENT ACTIONS
  // -----------------------------------------

  const openDepartments = (course) => {
    setSelectedCourse(course);
    setSemesterDepartmentId("");
    setSemesters([]);
  };

  const backToCourses = () => {
    setSelectedCourse(null);
    setDepartments([]);
  };

  const openAddDepartment = () => {
    setEditingDepartmentId(null);
    setDepartmentForm({ ...emptyDepartmentForm });
    setDepartmentModalOpen(true);
  };

  const openEditDepartment = (department) => {
    setEditingDepartmentId(department._id);
    setDepartmentForm({
      departmentName: department.departmentName || "",
      departmentCode: department.departmentCode || "",
      description: department.description || "",
      status: department.status || "active",
      isCurrent: Boolean(department.isCurrent),
    });
    setDepartmentModalOpen(true);
  };

  const handleDepartmentChange = (event) => {
    const { name, value, type, checked } = event.target;
    setDepartmentForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveDepartment = async (event) => {
    event.preventDefault();
    if (!selectedInstitution?._id || !selectedCourse?._id) {
      toast.error("Please select an institution and course first");
      return;
    }
    if (!departmentForm.departmentName.trim()) {
      toast.error("Please enter department name");
      return;
    }

    try {
      setDepartmentSaving(true);
      // Pure Department Payload properly associated
      const payload = {
        ...departmentForm,
        departmentName: departmentForm.departmentName.trim(),
        departmentCode: departmentForm.departmentCode.trim(),
        institution: selectedInstitution._id,
        academicProgram: selectedCourse._id, // Relates to the specific Course
      };

      let response;
      if (editingDepartmentId) {
        response = await api.patch(
          `/departments/${editingDepartmentId}`,
          payload,
        );
      } else {
        response = await api.post("/departments", payload);
      }

      const savedDepartment =
        response.data?.department || response.data?.data?.department;
      if (payload.isCurrent && savedDepartment?._id) {
        await api.patch(
          `/departments/${savedDepartment._id}/select-current`,
          {},
        );
      }

      setDepartmentModalOpen(false);
      setEditingDepartmentId(null);
      await loadDepartments(selectedCourse._id);
      toast.success(
        editingDepartmentId ? "Department updated" : "Department added",
      );

      // Update global header branch display if changed
      if (payload.isCurrent && currentCourse?._id === selectedCourse._id) {
        setGlobalCurrentDepartment(payload);
      }
    } catch (error) {
      console.error("Save department error:", error);
      toast.error(error.response?.data?.message || "Unable to save department");
    } finally {
      setDepartmentSaving(false);
    }
  };

  const setCurrentDepartment = async (departmentId) => {
    try {
      setCurrentDepartmentChanging(departmentId);
      await api.patch(`/departments/${departmentId}/select-current`, {});
      await loadDepartments(selectedCourse._id);
      toast.success("Current department updated");

      // Attempt to silently refresh global state if on active course
      if (currentCourse?._id === selectedCourse._id) {
        const d = departments.find((dep) => dep._id === departmentId);
        if (d) setGlobalCurrentDepartment(d);
      }
    } catch (error) {
      console.error("Set current department error:", error);
      toast.error(
        error.response?.data?.message || "Unable to update department",
      );
    } finally {
      setCurrentDepartmentChanging(null);
    }
  };

  // UI Helpers
  const initials = useMemo(() => {
    return (profile.name || user?.name || "Student")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }, [profile.name, user?.name]);

  const fullAddress = [
    profile.street,
    profile.city,
    profile.state,
    profile.postalCode,
    profile.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Settings2 size={16} />
            Account Settings
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Profile
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Manage your personal details and academic information.
          </p>
        </div>
        {activeSection === "personal" && (
          <button onClick={openProfileModal} className={buttonSecondary}>
            <Pencil size={17} />
            Edit Profile
          </button>
        )}
      </div>

      {/* REDESIGNED PROFILE HERO - CLEAN SAAS STYLE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-2xl font-bold text-slate-700 sm:h-24 sm:w-24 sm:text-3xl">
          {initials || "S"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <h2 className="truncate text-2xl font-bold text-slate-900">
              {profile.name || user?.name || "Student"}
            </h2>
            <div className="inline-flex w-max items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck size={14} />
              Verified Account
            </div>
          </div>
          <p className="mt-1 truncate text-sm text-slate-500">
            {profile.email || user?.email || ""}
          </p>

          {(globalCurrentInstitution ||
            globalCurrentCourse ||
            globalCurrentDepartment) && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-100 pt-4">
              {globalCurrentInstitution && (
                <div className="flex min-w-0 items-center gap-2">
                  <Building2 size={16} className="text-slate-400 shrink-0" />
                  <span className="truncate text-sm font-semibold text-slate-700">
                    {globalCurrentInstitution.institutionName}
                  </span>
                </div>
              )}
              {globalCurrentCourse && (
                <div className="flex min-w-0 items-center gap-2">
                  <GraduationCap
                    size={16}
                    className="text-slate-400 shrink-0"
                  />
                  <span className="truncate text-sm font-semibold text-slate-700">
                    {globalCurrentCourse.course}
                    <span className="ml-1 text-xs font-normal text-slate-500">
                      ({globalCurrentCourse.degree})
                    </span>
                  </span>
                </div>
              )}
              {globalCurrentDepartment && (
                <div className="flex min-w-0 items-center gap-2">
                  <Network size={16} className="text-slate-400 shrink-0" />
                  <span className="truncate text-sm font-semibold text-slate-700">
                    Branch: {globalCurrentDepartment.departmentName}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <button
          onClick={() => {
            setActiveSection("personal");
            backToInstitutions();
          }}
          className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            activeSection === "personal"
              ? "bg-violet-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <CircleUserRound size={18} />
          Personal Information
        </button>

        <button
          onClick={() => setActiveSection("academic")}
          className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            activeSection === "academic"
              ? "bg-violet-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <GraduationCap size={18} />
          Academic Information
        </button>
      </div>

      {/* PERSONAL PROFILE */}
      {activeSection === "personal" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 border-b border-slate-100 pb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Personal Information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your basic account and contact information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <InfoCard
                icon={UserRound}
                label="Full Name"
                value={profile.name}
              />
              <InfoCard
                icon={Mail}
                label="Email Address"
                value={profile.email}
              />
              <InfoCard
                icon={Phone}
                label="Phone Number"
                value={profile.phone}
              />
              <InfoCard
                icon={CalendarDays}
                label="Date of Birth"
                value={profile.dateOfBirth}
              />
              <InfoCard
                icon={UserRound}
                label="Gender"
                value={profile.gender?.replaceAll("_", " ")}
              />
              <InfoCard icon={MapPin} label="City" value={profile.city} />
              <InfoCard icon={MapPin} label="State" value={profile.state} />
              <InfoCard icon={Globe} label="Country" value={profile.country} />
              <div className="md:col-span-2">
                <InfoCard
                  icon={MapPin}
                  label="Full Address"
                  value={fullAddress}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck
                className="mt-0.5 shrink-0 text-slate-500"
                size={22}
              />
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Account Security
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Your name and email are strictly linked to your identity. If
                  you need them changed, please contact administration. Other
                  personal details are optional.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACADEMIC SETUP */}
      {activeSection === "academic" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* BREADCRUMB NAVIGATION */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-4 py-3 border border-slate-200 shadow-sm text-sm">
            <button
              onClick={backToInstitutions}
              className={`font-semibold transition ${
                !selectedInstitution
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Institutions
            </button>
            {selectedInstitution && (
              <>
                <ChevronRight size={15} className="text-slate-400" />
                <button
                  onClick={backToCourses}
                  className={`max-w-[180px] truncate font-semibold transition ${
                    !selectedCourse
                      ? "text-slate-900"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {selectedInstitution.institutionName}
                </button>
              </>
            )}
            {selectedCourse && (
              <>
                <ChevronRight size={15} className="text-slate-400" />
                <span className="max-w-[180px] truncate font-semibold text-slate-900">
                  {selectedCourse.course}
                </span>
              </>
            )}
          </div>

          {/* LEVEL 1: INSTITUTIONS */}
          {!selectedInstitution && (
            <div className="space-y-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    My Institutions
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage your educational institutions.
                  </p>
                </div>
                <button onClick={openAddInstitution} className={buttonPrimary}>
                  <Plus size={18} /> Add Institution
                </button>
              </div>

              {institutionLoading ? (
                <LoadingState message="Loading institutions..." />
              ) : institutions.length === 0 ? (
                <EmptyState
                  icon={School}
                  title="No institution added yet"
                  description="Start by adding your college, university, or school to map your academics."
                  buttonText="Add Your Institution"
                  onClick={openAddInstitution}
                />
              ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {institutions.map((institution) => (
                    <div
                      key={institution._id}
                      className={`rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
                        institution.isCurrent
                          ? "border-violet-500 ring-1 ring-violet-500/15"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="rounded-xl bg-slate-50 p-3 text-slate-600 border border-slate-100">
                            <Building2 size={24} />
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <h3 className="break-words text-lg font-bold text-slate-900">
                              {institution.institutionName}
                            </h3>
                            <p className="mt-1 text-sm capitalize text-slate-500">
                              {institution.institutionType || "Institution"}
                            </p>
                          </div>
                        </div>
                        {institution.isCurrent && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            <CheckCircle2 size={13} /> Current
                          </span>
                        )}
                      </div>

                      <div className="mt-6 space-y-3 text-sm text-slate-600">
                        {institution.universityName && (
                          <div className="flex items-center gap-2">
                            <GraduationCap
                              size={16}
                              className="text-slate-400"
                            />
                            {institution.universityName}
                          </div>
                        )}
                        {(institution.city || institution.state) && (
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-slate-400" />
                            {[
                              institution.city,
                              institution.state,
                              institution.country,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                        <div className="flex flex-wrap gap-2">
                          {!institution.isCurrent && (
                            <button
                              onClick={() =>
                                setCurrentInstitution(institution._id)
                              }
                              disabled={
                                currentInstitutionChanging === institution._id
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              {currentInstitutionChanging ===
                              institution._id ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Star size={15} />
                              )}
                              Set Current
                            </button>
                          )}
                          <button
                            onClick={() => openCourses(institution)}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            <BookOpen size={15} />
                            View Courses
                          </button>
                        </div>
                        <button
                          onClick={() => openEditInstitution(institution)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                          title="Edit Institution"
                        >
                          <Pencil size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 2: COURSES */}
          {selectedInstitution && !selectedCourse && (
            <div className="space-y-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Academic Courses
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Managing programs for {selectedInstitution.institutionName}
                  </p>
                </div>
                <button onClick={openAddCourse} className={buttonPrimary}>
                  <Plus size={18} /> Add Course
                </button>
              </div>

              {courseLoading ? (
                <LoadingState message="Loading courses..." />
              ) : courses.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="No courses added"
                  description="Add the specific course or degree you are pursuing at this institution."
                  buttonText="Add First Course"
                  onClick={openAddCourse}
                />
              ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {courses.map((course) => (
                    <div
                      key={course._id}
                      className={`rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
                        course.isCurrent
                          ? "border-violet-500 ring-1 ring-violet-500/15"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-slate-600">
                            <GraduationCap size={24} />
                          </div>
                          <div className="min-w-0 pt-0.5">
                            {/* BUG FIX: course.course strictly used for Course title */}
                            <h3 className="break-words text-lg font-bold text-slate-900">
                              {course.course}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500 font-medium">
                              {course.degree}{" "}
                              {course.programName && `• ${course.programName}`}
                            </p>
                          </div>
                        </div>
                        {course.isCurrent && (
                          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <InfoCard
                          icon={CalendarDays}
                          label="Batch"
                          value={`${course.batchStartYear} - ${course.batchEndYear}`}
                        />
                        <InfoCard
                          icon={Layers}
                          label="Semesters"
                          value={course.totalSemesters}
                        />
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                        <div className="flex flex-wrap gap-2">
                          {!course.isCurrent && (
                            <button
                              onClick={() => setCurrentCourse(course._id)}
                              disabled={
                                currentCourseChanging === course._id ||
                                !selectedInstitution.isCurrent
                              }
                              title={
                                !selectedInstitution.isCurrent
                                  ? "Set institution as current first"
                                  : ""
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {currentCourseChanging === course._id ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Star size={15} />
                              )}
                              Set Current
                            </button>
                          )}
                          <button
                            onClick={() => openDepartments(course)}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200"
                          >
                            <Network size={15} /> Departments / Branches
                          </button>
                        </div>
                        <button
                          onClick={() => openEditCourse(course)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                          title="Edit Course"
                        >
                          <Pencil size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 3: DEPARTMENTS / BRANCHES */}
          {selectedInstitution && selectedCourse && (
            <div className="space-y-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Departments & Branches
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage distinct branches for {selectedCourse.course}.
                  </p>
                </div>
                <button onClick={openAddDepartment} className={buttonPrimary}>
                  <Plus size={18} /> Add Branch
                </button>
              </div>

              {departmentLoading ? (
                <LoadingState message="Loading departments..." />
              ) : departments.length === 0 ? (
                <EmptyState
                  icon={Network}
                  title="No branches mapped"
                  description="Branches are completely optional. Add one if your course requires specific branch assignment."
                  buttonText="Add Department"
                  onClick={openAddDepartment}
                />
              ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {departments.map((department) => (
                    <div
                      key={department._id}
                      className={`rounded-2xl border bg-white p-6 shadow-sm ${
                        department.isCurrent
                          ? "border-violet-500 ring-1 ring-violet-500/15"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-slate-600">
                            <Network size={22} />
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <h3 className="break-words text-lg font-bold text-slate-900">
                              {department.departmentName}
                            </h3>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                              Code: {department.departmentCode || "N/A"}
                            </p>
                          </div>
                        </div>
                        {department.isCurrent && (
                          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            Current Branch
                          </span>
                        )}
                      </div>

                      {department.description && (
                        <p className="mt-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {department.description}
                        </p>
                      )}

                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                              department.status === "active"
                                ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                : "bg-slate-50 border-slate-200 text-slate-600"
                            }`}
                          >
                            {department.status === "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                          {!department.isCurrent &&
                            department.status === "active" && (
                              <button
                                onClick={() =>
                                  setCurrentDepartment(department._id)
                                }
                                disabled={
                                  currentDepartmentChanging ===
                                    department._id || !selectedCourse.isCurrent
                                }
                                title={
                                  !selectedCourse.isCurrent
                                    ? "Set course as current first"
                                    : ""
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {currentDepartmentChanging ===
                                department._id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Star size={14} />
                                )}{" "}
                                Set Current
                              </button>
                            )}
                        </div>
                        <button
                          onClick={() => openEditDepartment(department)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                        >
                          <Pencil size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SEMESTER MANAGEMENT */}
              <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-2 text-violet-600">
                      <Layers size={19} />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Academic timeline
                      </span>
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                      Semester Management
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Generate semesters automatically and manage the current
                      academic term.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={generateSemesters}
                    disabled={semesterGenerating || semesterLoading}
                    className={buttonPrimary}
                  >
                    {semesterGenerating ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                    {semesterGenerating
                      ? "Generating..."
                      : "Generate Semesters"}
                  </button>
                </div>
                {departments.length > 0 && (
                  <div className="mt-5 max-w-md">
                    <SelectField
                      label="Department / Branch"
                      name="semesterDepartmentId"
                      value={semesterDepartmentId}
                      onChange={(e) => setSemesterDepartmentId(e.target.value)}
                      options={[
                        { label: "Select a branch", value: "" },
                        ...departments.map((d) => ({
                          label: d.departmentName,
                          value: d._id,
                        })),
                      ]}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Select the branch whose semesters you want to manage.
                    </p>
                  </div>
                )}
                {departments.length === 0 && (
                  <p className="mt-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-800">
                    No branch is mapped to this course. Semesters will be
                    generated for the course without a department.
                  </p>
                )}
                <div className="mt-6">
                  {semesterLoading ? (
                    <LoadingState message="Loading semesters..." />
                  ) : semesters.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                      <Layers size={25} className="mx-auto text-slate-400" />
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        No semesters generated yet
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Click Generate Semesters to create the semester
                        structure for this course.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {Object.entries(
                        semesters.reduce((groups, semester) => {
                          const key =
                            semester.yearNumber ||
                            Math.ceil(semester.semesterNumber / 2);
                          (groups[key] ||= []).push(semester);
                          return groups;
                        }, {}),
                      )
                        .sort((a, b) => Number(a[0]) - Number(b[0]))
                        .map(([year, items]) => (
                          <div
                            key={year}
                            className="overflow-hidden rounded-xl border border-slate-200"
                          >
                            <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-3">
                              <div>
                                <p className="font-bold text-slate-900">
                                  Year {year}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {items[0]?.academicYear || "Academic year"}
                                </p>
                              </div>
                              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {items.length} semesters
                              </span>
                            </div>
                            <div className="divide-y divide-slate-100">
                              {items
                                .sort(
                                  (a, b) => a.semesterNumber - b.semesterNumber,
                                )
                                .map((semester) => (
                                  <div
                                    key={semester._id}
                                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold text-slate-900">
                                          Semester {semester.semesterNumber}
                                        </p>
                                        <span
                                          className={`rounded-full border px-2 py-0.5 text-[11px] font-bold capitalize ${semester.status === "current" ? "border-violet-200 bg-violet-50 text-violet-700" : semester.status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                                        >
                                          {semester.status}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {semester.startDate
                                          ? dateValue(semester.startDate)
                                          : "Start date pending"}{" "}
                                        –{" "}
                                        {semester.endDate
                                          ? dateValue(semester.endDate)
                                          : "End date pending"}
                                        {semester.attendanceTarget
                                          ? ` · Target ${semester.attendanceTarget}%`
                                          : ""}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {semester.status === "upcoming" && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSemesterSetup({
                                              id: semester._id,
                                              startDate: "",
                                              endDate: "",
                                              attendanceTarget: 75,
                                            })
                                          }
                                          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                                        >
                                          <CheckCircle2 size={14} /> Set Current
                                        </button>
                                      )}
                                      {semester.status === "current" && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            completeSelectedSemester(
                                              semester._id,
                                            )
                                          }
                                          disabled={
                                            semesterActionId === semester._id
                                          }
                                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                                        >
                                          {semesterActionId === semester._id ? (
                                            <Loader2
                                              size={14}
                                              className="animate-spin"
                                            />
                                          ) : (
                                            <CheckCircle2 size={14} />
                                          )}{" "}
                                          Complete Semester
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {semesterSetup.id && (
        <Modal
          title="Start Semester"
          description="Set the dates and attendance target for this semester."
          onClose={() =>
            !semesterActionId &&
            setSemesterSetup({
              id: "",
              startDate: "",
              endDate: "",
              attendanceTarget: 75,
            })
          }
        >
          <form onSubmit={startSelectedSemester} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Start Date"
                name="startDate"
                type="date"
                value={semesterSetup.startDate}
                onChange={(e) =>
                  setSemesterSetup((p) => ({ ...p, startDate: e.target.value }))
                }
                required
              />
              <Field
                label="End Date"
                name="endDate"
                type="date"
                value={semesterSetup.endDate}
                onChange={(e) =>
                  setSemesterSetup((p) => ({ ...p, endDate: e.target.value }))
                }
                required
                min={semesterSetup.startDate || undefined}
              />
              <Field
                label="Attendance Target (%)"
                name="attendanceTarget"
                type="number"
                min="1"
                max="100"
                value={semesterSetup.attendanceTarget}
                onChange={(e) =>
                  setSemesterSetup((p) => ({
                    ...p,
                    attendanceTarget: e.target.value,
                  }))
                }
                required
              />
            </div>
            <ModalActions
              saving={Boolean(semesterActionId)}
              onCancel={() =>
                setSemesterSetup({
                  id: "",
                  startDate: "",
                  endDate: "",
                  attendanceTarget: 75,
                })
              }
              submitText="Start Semester"
            />
          </form>
        </Modal>
      )}

      {/* -----------------------------------------
          INSTITUTION MODAL
      ----------------------------------------- */}
      {institutionModalOpen && (
        <Modal
          title={editingInstitutionId ? "Edit Institution" : "Add Institution"}
          description="Enter the basic details of your educational institution."
          onClose={() => !institutionSaving && setInstitutionModalOpen(false)}
        >
          <form onSubmit={saveInstitution} className="flex flex-col">
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    label="Institution Name"
                    name="institutionName"
                    value={institutionForm.institutionName}
                    onChange={handleInstitutionChange}
                    placeholder="e.g. ABC Institute of Technology"
                    required
                  />
                </div>
                <SelectField
                  label="Institution Type"
                  name="institutionType"
                  value={institutionForm.institutionType}
                  onChange={handleInstitutionChange}
                  required
                  options={[
                    { label: "College", value: "college" },
                    { label: "University", value: "university" },
                    { label: "School", value: "school" },
                    { label: "Other", value: "other" },
                  ]}
                />
                <Field
                  label="University / Board"
                  name="universityName"
                  value={institutionForm.universityName}
                  onChange={handleInstitutionChange}
                  placeholder="Affiliated university"
                  optional
                />
                <Field
                  label="Campus"
                  name="campus"
                  value={institutionForm.campus}
                  onChange={handleInstitutionChange}
                  placeholder="Campus location"
                  optional
                />
                <Field
                  label="City"
                  name="city"
                  value={institutionForm.city}
                  onChange={handleInstitutionChange}
                  placeholder="City"
                  optional
                />
                <Field
                  label="State"
                  name="state"
                  value={institutionForm.state}
                  onChange={handleInstitutionChange}
                  placeholder="State"
                  optional
                />
                <Field
                  label="Country"
                  name="country"
                  value={institutionForm.country}
                  onChange={handleInstitutionChange}
                  placeholder="Country"
                  optional
                />
                <Field
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={institutionForm.startDate}
                  onChange={handleInstitutionChange}
                  optional
                />
                <Field
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={institutionForm.endDate}
                  onChange={handleInstitutionChange}
                  disabled={institutionForm.isCurrent}
                  optional
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300">
                <input
                  type="checkbox"
                  name="isCurrent"
                  checked={institutionForm.isCurrent}
                  onChange={handleInstitutionChange}
                  className="mt-1 h-4 w-4 accent-violet-600"
                />
                <span>
                  <span className="block text-sm font-bold text-slate-900">
                    Set as Current Institution
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    Select this if you are currently studying here.
                  </span>
                </span>
              </label>
            </div>

            {/* Sticky Footer */}
            <ModalActions
              saving={institutionSaving}
              onCancel={() => setInstitutionModalOpen(false)}
              submitText={
                editingInstitutionId ? "Update Institution" : "Save Institution"
              }
            />
          </form>
        </Modal>
      )}

      {/* -----------------------------------------
          COURSE MODAL
      ----------------------------------------- */}
      {courseModalOpen && selectedInstitution && (
        <Modal
          title={editingCourseId ? "Edit Course" : "Add Course"}
          description={`Add the academic course details for ${selectedInstitution.institutionName}.`}
          onClose={() => !courseSaving && setCourseModalOpen(false)}
        >
          <form onSubmit={saveCourse} className="flex flex-col">
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Degree"
                  name="degree"
                  value={courseForm.degree}
                  onChange={handleCourseChange}
                  placeholder="e.g. B.Tech"
                  required
                />
                <Field
                  label="Program Name"
                  name="programName"
                  value={courseForm.programName}
                  onChange={handleCourseChange}
                  placeholder="e.g. Undergraduate"
                  required
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Course Name"
                    name="course"
                    value={courseForm.course}
                    onChange={handleCourseChange}
                    placeholder="e.g. Bachelor of Technology"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <p className="mb-4 text-sm font-bold text-slate-800">
                  Duration & Academic Details
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Batch Start Year"
                    name="batchStartYear"
                    type="number"
                    min="1900"
                    max="2100"
                    value={courseForm.batchStartYear}
                    onChange={handleCourseChange}
                    placeholder="2022"
                    required
                  />
                  <Field
                    label="Batch End Year"
                    name="batchEndYear"
                    type="number"
                    min="1900"
                    max="2100"
                    value={courseForm.batchEndYear}
                    onChange={handleCourseChange}
                    placeholder="2026"
                    required
                  />
                  <Field
                    label="Total Semesters"
                    name="totalSemesters"
                    type="number"
                    min="1"
                    max="20"
                    value={courseForm.totalSemesters}
                    onChange={handleCourseChange}
                    required
                  />
                  <Field
                    label="Academic Year"
                    name="academicYear"
                    value={courseForm.academicYear}
                    onChange={handleCourseChange}
                    placeholder="e.g. 2026-27"
                    optional
                  />
                  <Field
                    label="Target (%)"
                    name="attendanceTarget"
                    type="number"
                    min="1"
                    max="100"
                    value={courseForm.attendanceTarget}
                    onChange={handleCourseChange}
                    required
                  />
                </div>
              </div>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${selectedInstitution.isCurrent ? "border-slate-200 bg-slate-50 hover:border-slate-300" : "border-slate-100 bg-white opacity-60"}`}
              >
                <input
                  type="checkbox"
                  name="isCurrent"
                  checked={courseForm.isCurrent}
                  onChange={handleCourseChange}
                  disabled={!selectedInstitution.isCurrent}
                  className="mt-1 h-4 w-4 accent-violet-600 disabled:opacity-50"
                />
                <span>
                  <span className="block text-sm font-bold text-slate-900">
                    Set as Current Course
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    {selectedInstitution.isCurrent
                      ? "Select this if you are currently pursuing this course."
                      : "First set the institution as current."}
                  </span>
                </span>
              </label>
            </div>

            {/* Sticky Footer */}
            <ModalActions
              saving={courseSaving}
              onCancel={() => setCourseModalOpen(false)}
              submitText={editingCourseId ? "Update Course" : "Save Course"}
            />
          </form>
        </Modal>
      )}

      {/* -----------------------------------------
          DEPARTMENT MODAL
      ----------------------------------------- */}
      {departmentModalOpen && selectedCourse && selectedInstitution && (
        <Modal
          title={
            editingDepartmentId
              ? "Edit Department/Branch"
              : "Add Department/Branch"
          }
          description={`Mapping a branch for ${selectedCourse.course}.`}
          onClose={() => !departmentSaving && setDepartmentModalOpen(false)}
        >
          <form onSubmit={saveDepartment} className="flex flex-col">
            <div className="space-y-5">
              <Field
                label="Department / Branch Name"
                name="departmentName"
                value={departmentForm.departmentName}
                onChange={handleDepartmentChange}
                placeholder="e.g. Computer Science and Engineering"
                required
              />
              <Field
                label="Department Code"
                name="departmentCode"
                value={departmentForm.departmentCode}
                onChange={handleDepartmentChange}
                placeholder="e.g. CSE"
                optional
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Description{" "}
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    Optional
                  </span>
                </label>
                <textarea
                  name="description"
                  value={departmentForm.description}
                  onChange={handleDepartmentChange}
                  rows={3}
                  placeholder="Short description..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <SelectField
                label="Status"
                name="status"
                value={departmentForm.status}
                onChange={handleDepartmentChange}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ]}
              />

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${selectedCourse.isCurrent && departmentForm.status !== "inactive" ? "border-slate-200 bg-slate-50 hover:border-slate-300" : "border-slate-100 bg-white opacity-60"}`}
              >
                <input
                  type="checkbox"
                  name="isCurrent"
                  checked={departmentForm.isCurrent}
                  onChange={handleDepartmentChange}
                  disabled={
                    !selectedCourse.isCurrent ||
                    departmentForm.status === "inactive"
                  }
                  className="mt-1 h-4 w-4 accent-violet-600 disabled:opacity-50"
                />
                <span>
                  <span className="block text-sm font-bold text-slate-900">
                    Set as Current Branch
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    {selectedCourse.isCurrent
                      ? "Make this your active department."
                      : "First set the parent course as current."}
                  </span>
                </span>
              </label>
            </div>

            {/* Sticky Footer */}
            <ModalActions
              saving={departmentSaving}
              onCancel={() => setDepartmentModalOpen(false)}
              submitText={
                editingDepartmentId ? "Update Department" : "Save Department"
              }
            />
          </form>
        </Modal>
      )}

      {/* -----------------------------------------
          PERSONAL PROFILE MODAL
      ----------------------------------------- */}
      {profileModalOpen && (
        <Modal
          title="Edit Personal Profile"
          description="Update your contact and personal details."
          onClose={() => !profileSaving && setProfileModalOpen(false)}
        >
          <form onSubmit={saveProfile} className="flex flex-col">
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Phone Number"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  placeholder="Enter phone number"
                  optional
                />
                <Field
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={profileForm.dateOfBirth}
                  onChange={handleProfileChange}
                  optional
                />
                <SelectField
                  label="Gender"
                  name="gender"
                  value={profileForm.gender}
                  onChange={handleProfileChange}
                  optional
                  options={[
                    { label: "Select gender", value: "" },
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" },
                    { label: "Other", value: "other" },
                    { label: "Prefer not to say", value: "prefer_not_to_say" },
                  ]}
                />
                <Field
                  label="City"
                  name="city"
                  value={profileForm.city}
                  onChange={handleProfileChange}
                  placeholder="City"
                  optional
                />
                <Field
                  label="State"
                  name="state"
                  value={profileForm.state}
                  onChange={handleProfileChange}
                  placeholder="State"
                  optional
                />
                <Field
                  label="Postal Code"
                  name="postalCode"
                  value={profileForm.postalCode}
                  onChange={handleProfileChange}
                  placeholder="Postal code"
                  optional
                />
                <Field
                  label="Country"
                  name="country"
                  value={profileForm.country}
                  onChange={handleProfileChange}
                  placeholder="Country"
                  optional
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Street Address{" "}
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    Optional
                  </span>
                </label>
                <textarea
                  name="street"
                  value={profileForm.street || ""}
                  onChange={handleProfileChange}
                  rows={3}
                  placeholder="Enter your street address"
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            {/* Sticky Footer */}
            <ModalActions
              saving={profileSaving}
              onCancel={() => setProfileModalOpen(false)}
              submitText="Save Changes"
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
