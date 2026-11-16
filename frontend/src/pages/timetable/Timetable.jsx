import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Plus,
  Clock3,
  BookOpen,
  Coffee,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  GraduationCap,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const DAYS = [
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
  { label: "Saturday", value: "saturday" },
];

const EMPTY_FORM = {
  entryType: "lecture",
  dayOfWeek: "monday",
  subject: "",
  startTime: "09:00",
  endTime: "10:00",
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

const formatTime = (time) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const Timetable = () => {
  const [academicContext, setAcademicContext] = useState({
    institution: null,
    course: null,
    department: null,
    semester: null,
  });

  const [academicLoading, setAcademicLoading] = useState(true);
  const [academicError, setAcademicError] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [entries, setEntries] = useState([]);

  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [selectedDay, setSelectedDay] = useState("monday");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // ==========================================
  // Load Current Academic Context
  // ==========================================

  const loadAcademicContext = useCallback(async () => {
    try {
      setAcademicLoading(true);
      setAcademicError(false);

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

      const departmentResponse = await api.get("/departments", {
        params: {
          academicProgram: course._id,
        },
      });

      const departments = getList(departmentResponse, ["departments"]);

      const department = departments.find((item) => item?.isCurrent) || null;

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
      console.error("Academic context error:", error);

      setAcademicError(true);

      setAcademicContext({
        institution: null,
        course: null,
        department: null,
        semester: null,
      });

      toast.error(
        error.response?.data?.message || "Unable to load academic details",
      );
    } finally {
      setAcademicLoading(false);
    }
  }, []);

  // ==========================================
  // Load Semester Subjects
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

      setSubjects(records.filter((subject) => subject.status === "active"));
    } catch (error) {
      console.error("Load subjects error:", error);

      setSubjects([]);

      toast.error(error.response?.data?.message || "Unable to load subjects");
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  // ==========================================
  // Load Timetable
  // ==========================================

  const loadTimetable = useCallback(async (semesterId) => {
    if (!semesterId) {
      setEntries([]);
      return;
    }

    try {
      setTimetableLoading(true);

      const response = await api.get(`/timetables/semester/${semesterId}`);

      const records = getList(response, ["timetable"]);

      setEntries(records);
    } catch (error) {
      console.error("Load timetable error:", error);

      if (error.response?.status === 404) {
        setEntries([]);
      } else {
        toast.error(
          error.response?.data?.message || "Unable to load timetable",
        );
      }
    } finally {
      setTimetableLoading(false);
    }
  }, []);

  // ==========================================
  // Initial Loading
  // ==========================================

  useEffect(() => {
    loadAcademicContext();
  }, [loadAcademicContext]);

  useEffect(() => {
    const semesterId = academicContext.semester?._id;

    if (!academicLoading && semesterId) {
      loadSubjects(semesterId);
      loadTimetable(semesterId);
    } else if (!academicLoading) {
      setSubjects([]);
      setEntries([]);
    }
  }, [
    academicLoading,
    academicContext.semester?._id,
    loadSubjects,
    loadTimetable,
  ]);

  // ==========================================
  // Derived Data
  // ==========================================

  const selectedDayEntries = useMemo(() => {
    return entries
      .filter((item) => item.dayOfWeek === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [entries, selectedDay]);

  const lectureCount = useMemo(
    () => entries.filter((item) => item.entryType === "lecture").length,
    [entries],
  );

  const breakCount = useMemo(
    () => entries.filter((item) => item.entryType === "break").length,
    [entries],
  );

  // ==========================================
  // Modal Handlers
  // ==========================================

  const openAddModal = (type = "lecture") => {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
      entryType: type,
      dayOfWeek: selectedDay,
    });

    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id);

    setForm({
      entryType: item.entryType || "lecture",
      dayOfWeek: item.dayOfWeek,
      subject: item.subject?._id || "",
      startTime: item.startTime,
      endTime: item.endTime,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  // ==========================================
  // Form Change Handler
  // ==========================================

  const handleFormChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==========================================
  // Save Timetable Entry
  // ==========================================

  const handleSave = async (event) => {
    event.preventDefault();

    const semesterId = academicContext.semester?._id;

    if (!semesterId) {
      toast.error("Current semester not available");
      return;
    }

    if (!DAYS.some((day) => day.value === form.dayOfWeek)) {
      toast.error("Please select a valid day");
      return;
    }

    if (form.entryType === "lecture" && !form.subject) {
      toast.error("Please select a subject");
      return;
    }

    if (!form.startTime || !form.endTime) {
      toast.error("Please select start and end time");
      return;
    }

    if (form.endTime <= form.startTime) {
      toast.error("End time must be after start time");
      return;
    }

    const payload = {
      entryType: form.entryType,
      dayOfWeek: form.dayOfWeek,
      subject: form.entryType === "lecture" ? form.subject : null,
      startTime: form.startTime,
      endTime: form.endTime,
    };

    try {
      setSaving(true);

      if (editingId) {
        await api.patch(`/timetables/${editingId}`, payload);

        toast.success("Timetable updated successfully");
      } else {
        await api.post("/timetables", {
          semester: semesterId,
          ...payload,
        });

        toast.success(
          form.entryType === "break"
            ? "Lunch break added successfully"
            : "Lecture added successfully",
        );
      }

      setSelectedDay(form.dayOfWeek);

      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);

      await loadTimetable(semesterId);
    } catch (error) {
      console.error("Save timetable error:", error);

      toast.error(error.response?.data?.message || "Unable to save timetable");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // Delete / Archive Timetable Entry
  // ==========================================

  const handleDelete = async (item) => {
    const name =
      item.entryType === "break"
        ? "this break"
        : item.subject?.subjectName || "this lecture";

    const confirmed = window.confirm(
      `Are you sure you want to remove ${name}?`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(item._id);

      await api.delete(`/timetables/${item._id}`);

      toast.success("Timetable entry removed successfully");

      await loadTimetable(academicContext.semester?._id);
    } catch (error) {
      console.error("Delete timetable error:", error);

      toast.error(
        error.response?.data?.message || "Unable to remove timetable entry",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // Semester Information
  // ==========================================

  const semesterName = academicContext.semester
    ? academicContext.semester.semesterName ||
      `Semester ${academicContext.semester.semesterNumber || ""}`
    : "No current semester";

  // ==========================================
  // Loading UI
  // ==========================================

  if (academicLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />

        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />

        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  // ==========================================
  // Error UI
  // ==========================================

  if (academicError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
        <p className="font-semibold text-red-600">
          Unable to load academic details
        </p>

        <button
          onClick={loadAcademicContext}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // ==========================================
  // No Semester UI
  // ==========================================

  if (!academicContext.semester?._id) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <GraduationCap size={38} className="mx-auto text-slate-300" />

        <h2 className="mt-4 font-bold text-slate-800">No Current Semester</h2>

        <p className="mt-2 text-sm text-slate-500">
          Your current academic semester is not available.
        </p>
      </div>
    );
  }

  // ==========================================
  // Main UI
  // ==========================================

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-600">
            <CalendarDays size={17} />
            Academic Planner
          </div>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            My Timetable
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Organize your weekly lectures and breaks.
          </p>
        </div>

        <button
          onClick={() => loadTimetable(academicContext.semester._id)}
          disabled={timetableLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={timetableLoading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Semester and Statistics */}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <GraduationCap size={16} />
            Current Semester
          </div>

          <p className="mt-3 text-lg font-bold text-slate-900">
            {semesterName}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {academicContext.semester.academicYear || ""}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Total Lectures</p>

          <p className="mt-3 text-3xl font-bold text-indigo-600">
            {lectureCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Total Breaks</p>

          <p className="mt-3 text-3xl font-bold text-amber-600">{breakCount}</p>
        </div>
      </div>

      {/* Day Selector */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="font-bold text-slate-900">Select a Day</h2>

          <p className="mt-1 text-xs text-slate-500">
            Select a day to view or manage its timetable.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {DAYS.map((day) => {
            const count = entries.filter(
              (item) => item.dayOfWeek === day.value,
            ).length;

            const active = selectedDay === day.value;

            return (
              <button
                key={day.value}
                onClick={() => setSelectedDay(day.value)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                <p className="text-sm font-bold">{day.label.slice(0, 3)}</p>

                <p
                  className={`mt-1 text-[11px] ${
                    active ? "text-indigo-100" : "text-slate-400"
                  }`}
                >
                  {count} entries
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Day Schedule */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {DAYS.find((day) => day.value === selectedDay)?.label}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {selectedDayEntries.length} timetable entries
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openAddModal("break")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
            >
              <Coffee size={16} />
              Add Lunch Break
            </button>

            <button
              onClick={() => openAddModal("lecture")}
              disabled={subjects.length === 0 || subjectsLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              Add Lecture
            </button>
          </div>
        </div>

        {/* Schedule Loading */}

        {timetableLoading || subjectsLoading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : selectedDayEntries.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <CalendarDays size={40} className="mx-auto text-slate-300" />

            <h3 className="mt-4 font-bold text-slate-800">
              No timetable added
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Start by adding a lecture or lunch break.
            </p>

            <button
              onClick={() => openAddModal("lecture")}
              disabled={subjects.length === 0}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Plus size={17} />
              Add First Lecture
            </button>
          </div>
        ) : (
          <div className="space-y-3 p-4 sm:p-5">
            {selectedDayEntries.map((item, index) => {
              const isBreak = item.entryType === "break";

              return (
                <div
                  key={item._id}
                  className={`group flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${
                    isBreak
                      ? "border-amber-200 border-dashed bg-amber-50/70"
                      : "border-indigo-100 bg-indigo-50/50"
                  }`}
                >
                  {/* Timing */}

                  <div className="min-w-[125px]">
                    <p className="text-sm font-bold text-slate-800">
                      {formatTime(item.startTime)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      To {formatTime(item.endTime)}
                    </p>
                  </div>

                  <div className="hidden h-10 w-px bg-slate-200 sm:block" />

                  {/* Icon */}

                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isBreak
                        ? "bg-amber-100 text-amber-700"
                        : "bg-white text-indigo-600"
                    }`}
                  >
                    {isBreak ? <Coffee size={20} /> : <BookOpen size={20} />}
                  </div>

                  {/* Entry Details */}

                  <div className="min-w-0 flex-1">
                    <h3
                      className={`font-bold ${
                        isBreak ? "text-amber-800" : "text-slate-900"
                      }`}
                    >
                      {isBreak
                        ? "Lunch Break"
                        : item.subject?.subjectName || "Subject"}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {isBreak
                        ? "Break time"
                        : [item.subject?.subjectCode, item.subject?.teacherName]
                            .filter(Boolean)
                            .join(" · ") || "Lecture"}
                    </p>
                  </div>

                  {/* Actions */}

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => openEditModal(item)}
                      title="Edit"
                      className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item._id}
                      title="Remove"
                      className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-500 hover:border-red-200 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingId === item._id ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>

                  <span className="sr-only">Entry {index + 1}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add / Edit Modal */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? "Edit Entry" : "Add to Timetable"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {form.entryType === "break"
                    ? "Set your lunch break timing."
                    : "Select a subject and set its timing."}
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}

            <form onSubmit={handleSave} className="space-y-5 p-5 sm:p-6">
              {/* Entry Type */}

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  What do you want to add?
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        entryType: "lecture",
                      }))
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold ${
                      form.entryType === "lecture"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <BookOpen size={17} />
                    Lecture
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        entryType: "break",
                        subject: "",
                      }))
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold ${
                      form.entryType === "break"
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <Coffee size={17} />
                    Lunch Break
                  </button>
                </div>
              </div>

              {/* Day */}

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Select Day
                </label>

                <select
                  required
                  value={form.dayOfWeek}
                  onChange={(event) =>
                    handleFormChange("dayOfWeek", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                >
                  {DAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selection */}

              {form.entryType === "lecture" && (
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Select Subject *
                  </label>

                  <select
                    required
                    value={form.subject}
                    onChange={(event) =>
                      handleFormChange("subject", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="">Choose a subject</option>

                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.subjectName}
                        {subject.subjectCode ? ` (${subject.subjectCode})` : ""}
                      </option>
                    ))}
                  </select>

                  {subjects.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      No active subjects found in this semester.
                    </p>
                  )}
                </div>
              )}

              {/* Time Selection */}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Start Time *
                  </label>

                  <input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(event) =>
                      handleFormChange("startTime", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    End Time *
                  </label>

                  <input
                    type="time"
                    required
                    min={form.startTime}
                    value={form.endTime}
                    onChange={(event) =>
                      handleFormChange("endTime", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Preview */}

              <div
                className={`rounded-xl p-4 text-xs ${
                  form.entryType === "break"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-indigo-50 text-indigo-700"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {form.entryType === "break" ? (
                    <Coffee size={16} />
                  ) : (
                    <Clock3 size={16} />
                  )}

                  {form.entryType === "break"
                    ? "Lunch Break Preview"
                    : "Lecture Preview"}
                </div>

                <p className="mt-2">
                  {DAYS.find((day) => day.value === form.dayOfWeek)?.label}
                  {" · "}
                  {formatTime(form.startTime)}
                  {" – "}
                  {formatTime(form.endTime)}
                </p>
              </div>

              {/* Modal Footer */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    (form.entryType === "lecture" && subjects.length === 0)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      {editingId ? "Save Changes" : "Add to Timetable"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
