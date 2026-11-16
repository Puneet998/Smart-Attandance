import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";

import {
  BookOpen,
  Plus,
  Search,
  GraduationCap,
  Pencil,
  Trash2,
  Eye,
  X,
  Hash,
  Users,
  Building2,
  CalendarDays,
  Network,
  RefreshCw,
  UserRound,
} from "lucide-react";

// ==========================================
// INITIAL FORM
// ==========================================

const EMPTY_FORM = {
  subjectName: "",
  subjectCode: "",
  teacherName: "",
};

// ==========================================
// HELPER: GET LIST FROM API RESPONSE
// ==========================================

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

// ==========================================
// HELPER: NORMALIZE SUBJECT
// ==========================================

const normalizeSubject = (subject) => ({
  ...subject,
  id: subject?._id || subject?.id,
  subjectName: subject?.subjectName || "",
  subjectCode: subject?.subjectCode || "",
  teacherName: subject?.teacherName || "",
});

// ==========================================
// MAIN COMPONENT
// ==========================================

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [academicContext, setAcademicContext] = useState({
    institution: null,
    course: null,
    department: null,
    semester: null,
  });

  const [academicLoading, setAcademicLoading] = useState(true);
  const [academicError, setAcademicError] = useState(false);

  // ==========================================
  // LOAD CURRENT ACADEMIC CONTEXT
  // ==========================================

  const loadCurrentAcademicContext = useCallback(async () => {
    try {
      setAcademicLoading(true);
      setAcademicError(false);

      // 1. Get current institution
      const institutionResponse = await api.get("/institutions");

      const institutions = getList(institutionResponse, ["institutions"]);

      const institution = institutions.find((item) => item?.isCurrent) || null;

      if (!institution?._id) {
        setAcademicContext({
          institution: null,
          course: null,
          department: null,
          semester: null,
        });
        return;
      }

      // 2. Get current academic program
      const courseResponse = await api.get("/academic-programs", {
        params: {
          institution: institution._id,
        },
      });

      const programs = getList(courseResponse, [
        "academicPrograms",
        "programs",
        "courses",
      ]);

      const course = programs.find((item) => item?.isCurrent) || null;

      if (!course?._id) {
        setAcademicContext({
          institution,
          course: null,
          department: null,
          semester: null,
        });
        return;
      }

      // 3. Get current department
      const departmentResponse = await api.get("/departments", {
        params: {
          academicProgram: course._id,
        },
      });

      const departments = getList(departmentResponse, ["departments"]);

      const department = departments.find((item) => item?.isCurrent) || null;

      // 4. Get current semester
      const semesterResponse = await api.get(
        `/semesters/program/${course._id}/current`,
        {
          params: department?._id ? { departmentId: department._id } : {},
        },
      );

      const semester = semesterResponse?.data?.semester || null;

      setAcademicContext({
        institution,
        course,
        department,
        semester,
      });
    } catch (error) {
      console.error("Load current academic context error:", error);

      setAcademicError(true);

      setAcademicContext({
        institution: null,
        course: null,
        department: null,
        semester: null,
      });

      toast.error(
        error.response?.data?.message ||
          "Unable to load current academic details",
      );
    } finally {
      setAcademicLoading(false);
    }
  }, []);

  // ==========================================
  // LOAD SUBJECTS
  // ==========================================

  const loadSubjects = useCallback(async (semesterId) => {
    if (!semesterId) {
      setSubjects([]);
      return;
    }

    try {
      setSubjectsLoading(true);

      const response = await api.get(`/subjects/semester/${semesterId}`);

      const records = getList(response, ["subjects"]);

      setSubjects(records.map(normalizeSubject));
    } catch (error) {
      console.error("Load semester subjects error:", error);

      setSubjects([]);

      toast.error(error.response?.data?.message || "Unable to load subjects");
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  // ==========================================
  // INITIAL DATA LOAD
  // ==========================================

  useEffect(() => {
    loadCurrentAcademicContext();
  }, [loadCurrentAcademicContext]);

  useEffect(() => {
    if (!academicLoading) {
      loadSubjects(academicContext.semester?._id);
    }
  }, [academicLoading, academicContext.semester?._id, loadSubjects]);

  // ==========================================
  // SEARCH SUBJECTS
  // ==========================================

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return subjects;

    return subjects.filter((subject) => {
      return (
        subject.subjectName.toLowerCase().includes(query) ||
        subject.subjectCode.toLowerCase().includes(query) ||
        subject.teacherName.toLowerCase().includes(query)
      );
    });
  }, [subjects, search]);

  // ==========================================
  // UNIQUE TEACHERS
  // ==========================================

  const uniqueTeachers = useMemo(() => {
    return new Set(
      subjects
        .map((subject) => subject.teacherName.trim().toLowerCase())
        .filter(Boolean),
    ).size;
  }, [subjects]);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // OPEN ADD FORM
  // ==========================================

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
    setShowForm(true);
  };

  // ==========================================
  // OPEN EDIT FORM
  // ==========================================

  const openEditForm = (subject) => {
    setEditingId(subject.id);

    setFormData({
      subjectName: subject.subjectName || "",
      subjectCode: subject.subjectCode || "",
      teacherName: subject.teacherName || "",
    });

    setSelectedSubject(null);
    setShowForm(true);
  };

  // ==========================================
  // CLOSE FORM
  // ==========================================

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
  };

  // ==========================================
  // VALIDATE FORM
  // ==========================================

  const validateForm = () => {
    if (!academicContext.semester?._id) {
      toast.error("There is no current semester available.");
      return false;
    }

    if (!formData.subjectName.trim()) {
      toast.error("Subject name is required.");
      return false;
    }

    if (!formData.teacherName.trim()) {
      toast.error("Teacher name is required.");
      return false;
    }

    // Check duplicate subject code
    const enteredCode = formData.subjectCode.trim().toLowerCase();

    if (
      enteredCode &&
      subjects.some(
        (subject) =>
          subject.subjectCode.trim().toLowerCase() === enteredCode &&
          subject.id !== editingId,
      )
    ) {
      toast.error("This subject code already exists in this semester.");
      return false;
    }

    return true;
  };

  // ==========================================
  // ADD / UPDATE SUBJECT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    // Only subject-related fields are sent.
    // No startTime or endTime here.
    const subjectData = {
      subjectName: formData.subjectName.trim(),

      subjectCode: formData.subjectCode.trim()
        ? formData.subjectCode.trim().toUpperCase()
        : null,

      teacherName: formData.teacherName.trim(),
    };

    try {
      setSaving(true);

      if (editingId) {
        // Update existing subject
        await api.patch(`/subjects/${editingId}`, subjectData);

        toast.success("Subject updated successfully.");
      } else {
        // Create new subject
        await api.post("/subjects", {
          semester: academicContext.semester._id,
          ...subjectData,
        });

        toast.success("Subject added successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ ...EMPTY_FORM });

      await loadSubjects(academicContext.semester._id);
    } catch (error) {
      console.error("Save subject error:", error);

      toast.error(error.response?.data?.message || "Unable to save subject");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // ARCHIVE SUBJECT
  // ==========================================

  const handleArchive = async (subject) => {
    const subjectId = subject.id;

    if (!subjectId) {
      toast.error("Subject ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to archive "${subject.subjectName}"?`,
    );

    if (!confirmed) return;

    try {
      await api.delete(`/subjects/${subjectId}`);

      setSelectedSubject(null);

      toast.success("Subject archived successfully.");

      await loadSubjects(academicContext.semester?._id);
    } catch (error) {
      console.error("Archive subject error:", error);

      toast.error(error.response?.data?.message || "Unable to archive subject");
    }
  };

  // ==========================================
  // ACADEMIC DETAILS
  // ==========================================

  const academicDetails = [
    {
      label: "College / Institution",
      value: academicContext.institution?.institutionName || "Not selected",
      icon: Building2,
    },
    {
      label: "Course / Degree",
      value:
        [academicContext.course?.degree, academicContext.course?.course]
          .filter(Boolean)
          .join(" · ") || "Not selected",
      icon: GraduationCap,
    },
    {
      label: "Branch",
      value:
        academicContext.department?.departmentName ||
        (academicContext.course ? "Not applicable" : "Not selected"),
      icon: Network,
    },
    {
      label: "Current Semester",
      value: academicContext.semester
        ? academicContext.semester.semesterName ||
          `Semester ${academicContext.semester.semesterNumber || ""}`
        : "No Active Semester",
      icon: BookOpen,
    },
    {
      label: "Academic Year",
      value: academicContext.semester?.academicYear || "Not available",
      icon: CalendarDays,
    },
  ];

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="space-y-7">
      {/* PAGE HEADER */}

      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BookOpen size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Subjects</h1>

            <p className="mt-0.5 text-xs text-slate-400">
              Manage your subjects and assigned teachers
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          disabled={!academicContext.semester?._id || academicLoading}
          title={
            !academicContext.semester?._id
              ? "No active semester available"
              : "Add subject"
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={19} />
          Add Subject
        </button>
      </section>

      {/* CURRENT ACADEMIC CONTEXT */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Current Academic Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Subjects are linked to your current academic semester.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCurrentAcademicContext}
            disabled={academicLoading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              size={14}
              className={academicLoading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {academicLoading ? (
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : academicError ? (
          <div className="px-5 py-6 text-sm text-red-600">
            Academic details could not be loaded. Please refresh and try again.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
            {academicDetails.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
                >
                  <div className="rounded-lg bg-white p-2 text-indigo-600 shadow-sm">
                    <Icon size={17} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500">
                      {item.label}
                    </p>

                    <p className="mt-1 break-words text-sm font-bold text-slate-800">
                      {item.value}
                    </p>

                    {item.label === "Current Semester" &&
                    academicContext.semester?.yearNumber ? (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Year {academicContext.semester.yearNumber}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* STATISTICS */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          {
            title: "Total Subjects",
            value: subjects.length,
            icon: BookOpen,
            color: "bg-indigo-50 text-indigo-600",
          },
          {
            title: "Total Teachers",
            value: uniqueTeachers,
            icon: Users,
            color: "bg-blue-50 text-blue-600",
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}
              >
                <Icon size={21} />
              </div>

              <p className="mt-5 text-sm font-medium text-slate-500">
                {stat.title}
              </p>

              <h3 className="mt-1 text-3xl font-bold text-slate-900">
                {stat.value}
              </h3>
            </div>
          );
        })}
      </section>

      {/* SUBJECT LIST */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">All Subjects</h2>

              <p className="mt-1 text-xs text-slate-400">
                Browse and manage subjects in your current semester
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search subject, code or teacher..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </div>
        </div>

        {subjectsLoading ? (
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Search size={24} />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-800">
              {subjects.length === 0
                ? "No subjects added yet"
                : "No subjects found"}
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              {subjects.length === 0
                ? academicContext.semester
                  ? "Add your first subject to this semester."
                  : "A current semester is not available for your account."
                : "Try searching with another subject name, code or teacher."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredSubjects.map((subject) => (
              <article
                key={subject.id}
                className="group rounded-2xl border border-slate-200 p-5 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <BookOpen size={23} />
                  </div>

                  <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                    Active
                  </span>
                </div>

                <div className="mt-5 min-w-0">
                  <h3 className="break-words text-base font-bold text-slate-900">
                    {subject.subjectName}
                  </h3>

                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <Hash size={13} />
                    {subject.subjectCode || "No subject code"}
                  </p>
                </div>

                <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
                    <UserRound size={16} className="shrink-0 text-slate-400" />

                    <span className="truncate">
                      {subject.teacherName || "Teacher not assigned"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSubject(subject)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <Eye size={15} />
                    Details
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditForm(subject)}
                    className="flex h-9 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    aria-label={`Edit ${subject.subjectName}`}
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleArchive(subject)}
                    className="flex h-9 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    aria-label={`Archive ${subject.subjectName}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-400 sm:flex-row sm:items-center">
          <p>
            Showing {filteredSubjects.length} of {subjects.length} subjects
          </p>

          <p>
            {academicContext.semester
              ? `${
                  academicContext.semester.semesterName ||
                  `Semester ${academicContext.semester.semesterNumber || ""}`
                } · ${academicContext.semester.academicYear || "Academic year not set"}`
              : "No current semester selected"}
          </p>
        </div>
      </section>

      {/* ADD / EDIT SUBJECT MODAL */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? "Edit Subject" : "Add New Subject"}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Enter the subject and teacher details
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* SUBJECT NAME */}

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Subject Name *
                  </label>

                  <input
                    required
                    name="subjectName"
                    value={formData.subjectName}
                    onChange={handleFormChange}
                    maxLength={120}
                    placeholder="e.g. Data Structures"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                {/* SUBJECT CODE */}

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Subject Code
                  </label>

                  <input
                    name="subjectCode"
                    value={formData.subjectCode}
                    onChange={handleFormChange}
                    maxLength={30}
                    placeholder="e.g. CS301"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                {/* TEACHER NAME */}

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Teacher Name *
                  </label>

                  <input
                    required
                    name="teacherName"
                    value={formData.teacherName}
                    onChange={handleFormChange}
                    maxLength={120}
                    placeholder="Enter teacher name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* CURRENT SEMESTER */}

              <div className="rounded-xl bg-indigo-50/70 p-4 text-xs leading-5 text-indigo-700">
                <p className="font-semibold">Current semester</p>

                <p className="mt-1">
                  {academicContext.semester
                    ? academicContext.semester.semesterName ||
                      `Semester ${academicContext.semester.semesterNumber || ""}`
                    : "No active semester available"}
                </p>
              </div>

              {/* FORM BUTTONS */}

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !academicContext.semester?._id}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      {editingId ? "Update Subject" : "Save Subject"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBJECT DETAILS MODAL */}

      {selectedSubject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BookOpen size={23} />
                </div>

                <div className="min-w-0">
                  <h2 className="break-words text-lg font-bold text-slate-900">
                    {selectedSubject.subjectName}
                  </h2>

                  <p className="text-xs text-slate-400">
                    {selectedSubject.subjectCode || "No subject code"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubject(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {/* TEACHER DETAILS */}

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">Assigned Teacher</p>

                <p className="mt-2 text-sm font-bold text-slate-800">
                  {selectedSubject.teacherName || "Not assigned"}
                </p>
              </div>

              {/* SEMESTER DETAILS */}

              <div className="rounded-xl border border-slate-100 p-4">
                <p className="text-xs text-slate-400">Current Semester</p>

                <p className="mt-2 text-sm font-bold text-slate-800">
                  {academicContext.semester?.semesterName ||
                    `Semester ${academicContext.semester?.semesterNumber || "—"}`}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSubject(null)}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
