import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  CalendarX,
  Clock3,
  BookOpen,
  Download,
  Search,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Target,
  GraduationCap,
  RefreshCw,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const TARGET_PERCENTAGE = 75;

const arrayFrom = (response, keys = []) => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data?.[key])) return data.data[key];
  }

  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const objectFrom = (response) => {
  const data = response?.data ?? response;
  return data?.data ?? data;
};

const idOf = (value) => {
  if (!value) return "";
  return String(value?._id || value?.id || value);
};

const getSubjectName = (subject) =>
  subject?.subjectName || subject?.name || "Unknown Subject";

const getSubjectCode = (subject) =>
  subject?.subjectCode || subject?.code || "N/A";

const getStatus = (status = "") => {
  const value = String(status).toLowerCase().replace(/[\s-]/g, "_");

  if (value === "present") return "Present";
  if (value === "absent") return "Absent";

  if (
    value === "lecture_off" ||
    value === "class_off" ||
    value === "classoff"
  ) {
    return "Class Off";
  }

  if (value === "pending") return "Pending";

  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Unknown";
};

const getPercentage = (present = 0, absent = 0) => {
  const counted = Number(present) + Number(absent);

  return counted ? Number(((Number(present) / counted) * 100).toFixed(2)) : 0;
};

const formatDate = (value) => {
  if (!value) return "—";

  const dateString = String(value).slice(0, 10);
  const date = new Date(`${dateString}T12:00:00.000Z`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const formatTime = (value) => {
  if (!value) return "—";

  const [hours, minutes] = String(value).split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getPercentageStyle = (percentage, hasRecords = true) => {
  if (!hasRecords) {
    return {
      text: "text-gray-500",
      label: "No records",
      bar: "bg-gray-300",
    };
  }

  if (percentage >= TARGET_PERCENTAGE) {
    return {
      text: "text-emerald-600",
      label: "Target achieved",
      bar: "bg-emerald-500",
    };
  }

  if (percentage >= 65) {
    return {
      text: "text-amber-600",
      label: "Needs improvement",
      bar: "bg-amber-500",
    };
  }

  return {
    text: "text-red-600",
    label: "Below target",
    bar: "bg-red-500",
  };
};

const getStatusStyle = (status) => {
  switch (status) {
    case "Present":
      return "bg-emerald-50 text-emerald-700";

    case "Absent":
      return "bg-red-50 text-red-700";

    case "Class Off":
      return "bg-orange-50 text-orange-700";

    default:
      return "bg-gray-100 text-gray-600";
  }
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const downloadCSV = (headers, rows, filename) => {
  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};

export default function Reports() {
  const [semester, setSemester] = useState(null);
  const [report, setReport] = useState(null);
  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");

  const [activeTab, setActiveTab] = useState("overview");

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selectedSubject, setSelectedSubject] = useState("");

  // ==========================================
  // LOAD CURRENT SEMESTER
  // ==========================================

  const loadSemester = useCallback(async () => {
    const institutionRes = await api.get("/institutions");

    const institutions = arrayFrom(institutionRes, ["institutions"]);

    const institution =
      institutions.find((item) => item.isCurrent) || institutions[0];

    if (!institution) {
      throw new Error("No institution is linked to your account.");
    }

    const programsRes = await api.get(
      `/academic-programs?institution=${idOf(institution)}`,
    );

    const programs = arrayFrom(programsRes, ["programs", "academicPrograms"]);

    const program = programs.find((item) => item.isCurrent) || programs[0];

    if (!program) {
      throw new Error("No academic program found.");
    }

    const semesterRes = await api.get(
      `/semesters/program/${idOf(program)}/current`,
    );

    const semesterResponse = objectFrom(semesterRes);
    const semesterData =
      semesterResponse?.semester?.semester ||
      semesterResponse?.semester ||
      semesterResponse;

    if (!semesterData?._id) {
      throw new Error("No current semester found.");
    }

    setSemester(semesterData);

    return semesterData;
  }, []);

  // ==========================================
  // LOAD REPORT + ATTENDANCE HISTORY
  // ==========================================

  const loadReportData = useCallback(async (currentSemester) => {
    const semesterId = idOf(currentSemester);

    if (!semesterId) {
      throw new Error("Semester ID is missing.");
    }

    const [reportResponse, attendanceResponse] = await Promise.all([
      api.get(`/reports/semester/${semesterId}`),
      api.get(`/attendance/semester/${semesterId}`),
    ]);

    const reportData = objectFrom(reportResponse);

    const reportPayload =
      reportData?.report || reportData?.data?.report || reportData;

    if (
      !Array.isArray(reportPayload?.subjectReports) ||
      !reportPayload?.summary
    ) {
      throw new Error(
        "Invalid report response. Please check the report API response.",
      );
    }

    const attendanceData = arrayFrom(attendanceResponse, [
      "records",
      "attendance",
      "attendances",
    ]);

    setReport(reportPayload);
    setRecords(attendanceData);
  }, []);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  const loadPage = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setPageError("");

        const currentSemester = await loadSemester();

        await loadReportData(currentSemester);
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to load attendance report.",
        );

        setPageError(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadSemester, loadReportData],
  );

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  // ==========================================
  // NORMALIZE SUBJECT REPORTS
  // ==========================================

  const subjects = useMemo(() => {
    if (!report?.subjectReports) return [];

    return report.subjectReports.map((item, index) => {
      // Handle populated subject object OR lookup array
      const rawSubject = item.subjectDetails || item.subject || {};

      const subject = Array.isArray(rawSubject)
        ? rawSubject[0] || {}
        : rawSubject;

      const present = Number(item.present || 0);
      const absent = Number(item.absent || 0);
      const classOff = Number(item.classOff ?? item.lectureOff ?? 0);

      const totalCounted = present + absent;

      const percentage =
        item.percentage !== undefined
          ? Number(item.percentage)
          : getPercentage(present, absent);

      // Use actual MongoDB subject ID
      const subjectId = item.subjectId || item._id || subject._id || subject.id;

      return {
        id: idOf(subjectId),
        name: item.subjectName || getSubjectName(subject),
        code: item.subjectCode || getSubjectCode(subject),

        present,
        absent,
        classOff,

        total: totalCounted + classOff,
        totalCounted,
        percentage,

        targetPercentage: Number(
          item.targetPercentage || report.targetPercentage || TARGET_PERCENTAGE,
        ),

        status: item.status || "unknown",
        requiredLectures: item.requiredLectures ?? 0,
        safeAbsences: item.safeAbsences ?? 0,

        missedLectures: Array.isArray(item.missedLectures)
          ? item.missedLectures
          : [],
      };
    });
  }, [report]);

  // ==========================================
  // NORMALIZE HISTORY RECORDS
  // ==========================================

  const attendanceRecords = useMemo(() => {
    return records.map((record) => {
      const subject = record.subjectDetails || record.subject || {};

      const timetable = record.timetableDetails || record.timetable || {};

      const dateValue = record.classDate || record.date || "";

      return {
        id: idOf(record) || `${idOf(subject)}-${dateValue}`,
        subjectId: idOf(subject) || idOf(record.subjectId),
        subject: getSubjectName(subject),
        code: getSubjectCode(subject),
        date: String(dateValue).slice(0, 10),
        startTime:
          record.classStartTime ||
          timetable.startTime ||
          record.startTime ||
          "",
        endTime:
          record.classEndTime || timetable.endTime || record.endTime || "",
        status: getStatus(record.status),
      };
    });
  }, [records]);

  // ==========================================
  // OVERALL SUMMARY
  // ==========================================

  const summary = useMemo(() => {
    return subjects.reduce(
      (acc, subject) => {
        acc.present += subject.present;
        acc.absent += subject.absent;
        acc.classOff += subject.classOff;
        acc.total += subject.total;
        return acc;
      },
      {
        present: 0,
        absent: 0,
        classOff: 0,
        total: 0,
      },
    );
  }, [subjects]);

  const totalCounted = summary.present + summary.absent;

  const overallPercentage = getPercentage(summary.present, summary.absent);

  const targetPercentage = Number(
    report?.targetPercentage || TARGET_PERCENTAGE,
  );

  const belowTarget = subjects.filter(
    (subject) =>
      subject.totalCounted > 0 && subject.percentage < subject.targetPercentage,
  );

  const achievedSubjects = subjects.filter(
    (subject) =>
      subject.totalCounted > 0 &&
      subject.percentage >= subject.targetPercentage,
  );

  // ==========================================
  // FILTER SUBJECTS
  // ==========================================

  const filteredSubjects = useMemo(() => {
    const query = search.toLowerCase().trim();

    return subjects.filter((subject) => {
      return (
        subject.name.toLowerCase().includes(query) ||
        subject.code.toLowerCase().includes(query)
      );
    });
  }, [subjects, search]);

  // ==========================================
  // FILTER ATTENDANCE HISTORY
  // ==========================================

  const filteredRecords = useMemo(() => {
    const query = search.toLowerCase().trim();

    return attendanceRecords
      .filter((record) => {
        const matchesSearch =
          record.subject.toLowerCase().includes(query) ||
          record.code.toLowerCase().includes(query);

        const matchesSubject =
          subjectFilter === "All" || record.subjectId === subjectFilter;

        const matchesStatus =
          statusFilter === "All" || record.status === statusFilter;

        const matchesFrom = !dateFrom || record.date >= dateFrom;

        const matchesTo = !dateTo || record.date <= dateTo;

        return (
          matchesSearch &&
          matchesSubject &&
          matchesStatus &&
          matchesFrom &&
          matchesTo
        );
      })
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);

        if (dateCompare !== 0) return dateCompare;

        return a.startTime.localeCompare(b.startTime);
      });
  }, [
    attendanceRecords,
    search,
    subjectFilter,
    statusFilter,
    dateFrom,
    dateTo,
  ]);

  const selectedSubjectReport = subjects.find(
    (subject) => subject.id === selectedSubject,
  );

  console.log(
    "SUBJECT OPTIONS:",
    subjects.map((s) => ({
      name: s.name,
      id: s.id,
    })),
  );

  console.log("SELECTED SUBJECT ID:", selectedSubject);
  console.log("SELECTED SUBJECT DATA:", selectedSubjectReport);
  // ==========================================
  // RESET FILTERS
  // ==========================================

  const resetFilters = () => {
    setSearch("");
    setSubjectFilter("All");
    setStatusFilter("All");
    setDateFrom("");
    setDateTo("");
  };

  // ==========================================
  // EXPORT ATTENDANCE CSV
  // ==========================================

  const exportCSV = () => {
    if (!filteredRecords.length) {
      toast.error("No attendance records available to export.");
      return;
    }

    const headers = [
      "Subject",
      "Subject Code",
      "Date",
      "Start Time",
      "End Time",
      "Status",
    ];

    const rows = filteredRecords.map((record) => [
      record.subject,
      record.code,
      record.date,
      record.startTime,
      record.endTime,
      record.status,
    ]);

    downloadCSV(headers, rows, "SmartAttend-Attendance-Report.csv");

    toast.success("Attendance report exported.");
  };

  // ==========================================
  // EXPORT SUBJECT CSV
  // ==========================================

  const exportSubjectCSV = () => {
    if (!subjects.length) {
      toast.error("No subject report available.");
      return;
    }

    const headers = [
      "Subject",
      "Subject Code",
      "Present",
      "Absent",
      "Class Off",
      "Total Conducted",
      "Attendance Percentage",
      "Target",
      "Required Lectures",
      "Safe Absences",
    ];

    const rows = subjects.map((subject) => [
      subject.name,
      subject.code,
      subject.present,
      subject.absent,
      subject.classOff,
      subject.total,
      `${subject.percentage}%`,
      `${subject.targetPercentage}%`,
      subject.requiredLectures,
      subject.safeAbsences,
    ]);

    downloadCSV(headers, rows, "SmartAttend-Subject-Report.csv");

    toast.success("Subject report exported.");
  };

  const printReport = () => {
    window.print();
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={35} />
        <p className="text-sm font-medium text-gray-500">
          Loading your attendance report...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR SCREEN
  // ==========================================

  if (pageError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <AlertTriangle size={38} className="mx-auto text-red-500" />

        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Unable to load report
        </h2>

        <p className="mt-2 text-sm text-gray-500">{pageError}</p>

        <button
          onClick={() => loadPage(true)}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="space-y-7 pb-10">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="mb-2 text-sm font-medium text-indigo-600">
            Academic Performance
          </p>

          <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>

          <p className="mt-2 text-sm text-gray-500">
            Review your attendance performance and academic progress.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadPage(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={printReport}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <FileText size={17} />
            Print
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Download size={17} />
            Export CSV
          </button>
        </div>
      </div>

      {/* SEMESTER INFORMATION */}

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white p-3 text-indigo-600 shadow-sm">
            <GraduationCap size={25} />
          </div>

          <div>
            <p className="text-xs font-medium text-indigo-600">
              CURRENT ACADEMIC PROGRAM
            </p>

            <h2 className="mt-1 font-semibold text-gray-900">
              {semester?.academicProgram?.programName ||
                semester?.academicProgram?.name ||
                semester?.programName ||
                "Academic Program"}
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {semester?.semesterName ||
                `Semester ${semester?.semesterNumber || ""}`}
              {" · "}
              {semester?.academicYear || "Current Academic Year"}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-500">Attendance Target</p>

          <p className="mt-1 text-xl font-bold text-indigo-600">
            {targetPercentage}%
          </p>
        </div>
      </div>

      {/* NO SUBJECTS */}

      {subjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <BookOpen size={38} className="mx-auto text-gray-300" />

          <h3 className="mt-4 font-semibold text-gray-800">
            No subject report available
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            No active subjects or attendance report was found for this semester.
          </p>
        </div>
      ) : (
        <>
          {/* OVERALL STATS */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Overall Attendance</p>

                <TrendingUp className="text-indigo-600" size={21} />
              </div>

              <p className="mt-3 text-3xl font-bold text-gray-900">
                {overallPercentage}%
              </p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{
                    width: `${Math.min(overallPercentage, 100)}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Based on Present + Absent
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Present</p>
                <CheckCircle2 className="text-emerald-600" size={21} />
              </div>

              <p className="mt-3 text-3xl font-bold text-gray-900">
                {summary.present}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                Successfully attended lectures
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Absent</p>
                <XCircle className="text-red-500" size={21} />
              </div>

              <p className="mt-3 text-3xl font-bold text-gray-900">
                {summary.absent}
              </p>

              <p className="mt-2 text-xs text-gray-400">Missed lectures</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Class Off</p>
                <CalendarX className="text-orange-500" size={21} />
              </div>

              <p className="mt-3 text-3xl font-bold text-gray-900">
                {summary.classOff}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                Excluded from percentage
              </p>
            </div>
          </div>

          {/* COUNTED LECTURES */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <p className="text-sm font-medium text-gray-600">
                Counted Lectures
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {totalCounted}
              </p>

              <p className="mt-1 text-xs text-gray-400">Present + Absent</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <p className="text-sm font-medium text-gray-600">
                Total Subjects
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {subjects.length}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Subjects in current report
              </p>
            </div>
          </div>

          {/* ATTENDANCE ALERT */}

          {belowTarget.length > 0 && (
            <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <AlertTriangle
                className="mt-0.5 shrink-0 text-amber-600"
                size={22}
              />

              <div>
                <h3 className="font-semibold text-amber-900">
                  Attendance needs attention
                </h3>

                <p className="mt-1 text-sm text-amber-800">
                  {belowTarget.length} subject(s) are below the{" "}
                  {targetPercentage}% attendance target:{" "}
                  {belowTarget.map((subject) => subject.name).join(", ")}.
                </p>
              </div>
            </div>
          )}

          {/* TABS */}

          <div className="flex gap-6 overflow-x-auto border-b border-gray-200">
            {[
              { id: "overview", label: "Subject Overview" },
              { id: "history", label: "Attendance History" },
              { id: "analysis", label: "Performance Analysis" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 border-b-2 pb-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SUBJECT OVERVIEW */}

          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Subject-wise Attendance
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Compare attendance across all subjects.
                  </p>
                </div>

                <button
                  onClick={exportSubjectCSV}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <FileSpreadsheet size={17} />
                  Export Subjects
                </button>
              </div>

              <div className="relative max-w-md">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search subject or code..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredSubjects.map((subject) => {
                  const style = getPercentageStyle(
                    subject.percentage,
                    subject.totalCounted > 0,
                  );

                  return (
                    <div
                      key={subject.id}
                      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {subject.name}
                          </h3>

                          <p className="mt-1 text-xs text-gray-500">
                            {subject.code}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className={`text-2xl font-bold ${style.text}`}>
                            {subject.percentage}%
                          </p>

                          <span className={`text-xs font-medium ${style.text}`}>
                            {style.label}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all ${style.bar}`}
                          style={{
                            width: `${Math.min(subject.percentage, 100)}%`,
                          }}
                        />
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          {
                            label: "Present",
                            value: subject.present,
                            color: "text-emerald-600",
                          },
                          {
                            label: "Absent",
                            value: subject.absent,
                            color: "text-red-600",
                          },
                          {
                            label: "Class Off",
                            value: subject.classOff,
                            color: "text-orange-600",
                          },
                          {
                            label: "Total",
                            value: subject.total,
                            color: "text-gray-800",
                          },
                        ].map((item) => (
                          <div key={item.label}>
                            <p className="text-xs text-gray-400">
                              {item.label}
                            </p>

                            <p className={`mt-1 font-semibold ${item.color}`}>
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 rounded-xl bg-gray-50 p-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Required target</span>

                          <span className="font-semibold text-gray-800">
                            {subject.targetPercentage}%
                          </span>
                        </div>

                        {subject.totalCounted === 0 ? (
                          <p className="mt-3 text-sm text-gray-600">
                            No marked lectures available yet.
                          </p>
                        ) : subject.percentage < subject.targetPercentage ? (
                          <p className="mt-3 text-sm text-amber-700">
                            Attend the next{" "}
                            <strong>
                              {subject.requiredLectures === null
                                ? "all possible lectures"
                                : subject.requiredLectures}
                            </strong>{" "}
                            consecutive lectures to reach the target.
                          </p>
                        ) : (
                          <p className="mt-3 text-sm text-emerald-700">
                            You can miss <strong>{subject.safeAbsences}</strong>{" "}
                            upcoming lecture(s) and still maintain the target.
                          </p>
                        )}
                      </div>

                      {subject.missedLectures.length > 0 && (
                        <div className="mt-4">
                          <p className="mb-2 text-xs font-semibold text-red-600">
                            Missed lectures ({subject.missedLectures.length})
                          </p>

                          <div className="space-y-2">
                            {subject.missedLectures.map((lecture, index) => (
                              <div
                                key={lecture.attendanceId || index}
                                className="flex items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2"
                              >
                                <div>
                                  <p className="text-xs font-medium text-gray-800">
                                    {formatDate(lecture.classDate)}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500">
                                    {lecture.dayOfWeek || ""}
                                  </p>
                                </div>

                                <p className="text-xs font-medium text-red-700">
                                  {formatTime(lecture.startTime)} -{" "}
                                  {formatTime(lecture.endTime)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {filteredSubjects.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center text-sm text-gray-500">
                  No subjects found.
                </div>
              )}
            </div>
          )}

          {/* ATTENDANCE HISTORY */}

          {activeTab === "history" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Attendance History
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Search attendance records using date, subject and status.
                </p>
              </div>

              {/* FILTERS */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search subject..."
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="relative">
                  <BookOpen
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-8 text-sm outline-none focus:border-indigo-400"
                  >
                    <option value="All">All Subjects</option>

                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>

                <div className="relative">
                  <BarChart3
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-8 text-sm outline-none focus:border-indigo-400"
                  >
                    <option value="All">All Status</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Class Off">Class Off</option>
                    <option value="Pending">Pending</option>
                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>

                <button
                  onClick={resetFilters}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Reset Filters
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-500">
                    From Date
                  </label>

                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-500">
                    To Date
                  </label>

                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* HISTORY TABLE */}

              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left">
                    <thead className="bg-gray-50">
                      <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <th className="px-5 py-4">Subject</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4">Time</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {filteredRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-gray-800">
                              {record.subject}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {record.code}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-600">
                            {formatDate(record.date)}
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-600">
                            {formatTime(record.startTime)} -{" "}
                            {formatTime(record.endTime)}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(record.status)}`}
                            >
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredRecords.length === 0 && (
                  <div className="py-12 text-center text-sm text-gray-500">
                    No attendance records match your filters.
                  </div>
                )}

                <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
                  Showing {filteredRecords.length} of {attendanceRecords.length}{" "}
                  records
                </div>
              </div>
            </div>
          )}

          {/* PERFORMANCE ANALYSIS */}

          {activeTab === "analysis" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Performance Analysis
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Understand your attendance target and subject performance.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* OVERALL TARGET */}

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                      <Target size={23} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Attendance Target
                      </h3>

                      <p className="text-xs text-gray-500">
                        Minimum required attendance: {targetPercentage}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-center">
                    <div
                      className="relative flex h-44 w-44 items-center justify-center rounded-full"
                      style={{
                        background: `conic-gradient(#6366f1 ${Math.min(overallPercentage, 100) * 3.6}deg, #eef2ff 0deg)`,
                      }}
                    >
                      <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white">
                        <p className="text-4xl font-bold text-gray-900">
                          {overallPercentage}%
                        </p>

                        <p className="mt-1 text-xs text-gray-500">Current</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-2">
                    {overallPercentage >= targetPercentage ? (
                      <>
                        <CheckCircle2 size={17} className="text-emerald-600" />

                        <span className="text-sm font-semibold text-emerald-700">
                          Overall target achieved.
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={17} className="text-amber-600" />

                        <span className="text-sm font-semibold text-amber-700">
                          Overall attendance is below target.
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* SELECT SUBJECT */}

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900">
                    Subject Performance
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Select a subject to see its attendance breakdown.
                  </p>

                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                    }}
                    className="mt-5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400"
                  >
                    <option value="">Select Subject</option>

                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>

                  {selectedSubjectReport ? (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {selectedSubjectReport.name}
                        </span>

                        <span
                          className={`text-xl font-bold ${
                            getPercentageStyle(
                              selectedSubjectReport.percentage,
                              selectedSubjectReport.totalCounted > 0,
                            ).text
                          }`}
                        >
                          {selectedSubjectReport.percentage}%
                        </span>
                      </div>

                      {[
                        {
                          label: "Present",
                          value: selectedSubjectReport.present,
                          color: "bg-emerald-500",
                        },
                        {
                          label: "Absent",
                          value: selectedSubjectReport.absent,
                          color: "bg-red-500",
                        },
                        {
                          label: "Class Off",
                          value: selectedSubjectReport.classOff,
                          color: "bg-orange-500",
                        },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="mb-1.5 flex justify-between text-xs">
                            <span className="text-gray-500">{item.label}</span>

                            <span className="font-semibold text-gray-800">
                              {item.value}
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${item.color}`}
                              style={{
                                width: `${
                                  selectedSubjectReport.total
                                    ? (item.value /
                                        selectedSubjectReport.total) *
                                      100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}

                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">
                          Attendance target
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {selectedSubjectReport.targetPercentage}%
                        </p>

                        {selectedSubjectReport.totalCounted === 0 ? (
                          <p className="mt-3 text-sm text-gray-600">
                            No attendance records available.
                          </p>
                        ) : selectedSubjectReport.percentage <
                          selectedSubjectReport.targetPercentage ? (
                          <p className="mt-3 text-sm text-amber-700">
                            Required consecutive lectures:{" "}
                            <strong>
                              {selectedSubjectReport.requiredLectures === null
                                ? "Not achievable with the current absences"
                                : selectedSubjectReport.requiredLectures}
                            </strong>
                          </p>
                        ) : (
                          <p className="mt-3 text-sm text-emerald-700">
                            Safe upcoming absences:{" "}
                            <strong>
                              {selectedSubjectReport.safeAbsences}
                            </strong>
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 rounded-xl bg-gray-50 py-8 text-center">
                      <BookOpen className="mx-auto text-gray-300" size={30} />

                      <p className="mt-3 text-sm text-gray-500">
                        Select a subject to view its analysis.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ALL SUBJECT TARGET COMPARISON */}

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900">
                  Attendance Target Comparison
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Compare each subject against the required attendance target.
                </p>

                <div className="mt-6 space-y-5">
                  {subjects.map((subject) => {
                    const style = getPercentageStyle(
                      subject.percentage,
                      subject.totalCounted > 0,
                    );

                    return (
                      <div key={subject.id}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {subject.name}
                            </p>

                            <p className="text-xs text-gray-400">
                              {subject.code}
                            </p>
                          </div>

                          <span className={`text-sm font-bold ${style.text}`}>
                            {subject.percentage}%
                          </span>
                        </div>

                        <div className="relative h-3 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${style.bar}`}
                            style={{
                              width: `${Math.min(subject.percentage, 100)}%`,
                            }}
                          />

                          <div
                            className="absolute bottom-0 top-0 w-0.5 bg-gray-900"
                            style={{
                              left: `${subject.targetPercentage}%`,
                            }}
                          />
                        </div>

                        <p className="mt-1.5 text-right text-xs text-gray-400">
                          {subject.totalCounted === 0
                            ? "No records"
                            : subject.percentage >= subject.targetPercentage
                              ? "Target achieved"
                              : `${(
                                  subject.targetPercentage - subject.percentage
                                ).toFixed(2)}% below target`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TARGET SUMMARY */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                  <p className="text-sm font-medium text-red-800">
                    Subjects Below Target
                  </p>

                  <p className="mt-2 text-3xl font-bold text-red-700">
                    {belowTarget.length}
                  </p>

                  <p className="mt-1 text-xs text-red-600">Need improvement</p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-sm font-medium text-emerald-800">
                    Subjects Achieving Target
                  </p>

                  <p className="mt-2 text-3xl font-bold text-emerald-700">
                    {achievedSubjects.length}
                  </p>

                  <p className="mt-1 text-xs text-emerald-600">
                    Meeting the required percentage
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* FOOTER NOTE */}

      <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-gray-500" />

        <p className="text-xs leading-5 text-gray-500">
          Attendance percentage is calculated using Present and Absent records
          only. Class Off records are excluded from the percentage. Required
          lectures and safe absences are based on the current attendance
          calculation.
        </p>
      </div>
    </div>
  );
}
