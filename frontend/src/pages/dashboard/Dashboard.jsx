import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  CalendarX,
  RefreshCw,
  Loader2,
  MapPin,
  Target,
  Building2,
  ClipboardList,
  Sparkles,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const getPercentage = (present = 0, absent = 0) => {
  const total = present + absent;
  return total ? Number(((present / total) * 100).toFixed(2)) : 0;
};

const formatDate = (date) => {
  if (!date) return "";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (time) => {
  if (!time) return "Time not available";

  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getAttendanceStatus = (status) => {
  switch (status) {
    case "present":
      return {
        label: "Present",
        className: "bg-emerald-50 text-emerald-700",
        icon: CheckCircle2,
      };

    case "absent":
      return {
        label: "Absent",
        className: "bg-red-50 text-red-700",
        icon: XCircle,
      };

    case "lecture_off":
      return {
        label: "Class Off",
        className: "bg-orange-50 text-orange-700",
        icon: CalendarX,
      };

    default:
      return {
        label: "Not Marked",
        className: "bg-gray-100 text-gray-600",
        icon: Clock3,
      };
  }
};

const Dashboard = () => {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/dashboard");

      const data = response?.data?.dashboard;

      setDashboard(data || null);
    } catch (err) {
      console.error("Dashboard fetch error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load dashboard. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4">
        <div className="rounded-2xl bg-indigo-50 p-4">
          <Loader2 size={35} className="animate-spin text-indigo-600" />
        </div>
        <p className="text-sm font-medium text-gray-500">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-red-100 bg-white p-8 text-center">
        <AlertCircle size={42} className="text-red-500" />

        <h2 className="mt-4 text-lg font-bold text-gray-900">
          Dashboard unavailable
        </h2>

        <p className="mt-2 max-w-md text-sm text-gray-500">{error}</p>

        <button
          onClick={() => loadDashboard(true)}
          className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  // Setup state
  if (!dashboard || !dashboard.semester) {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <GraduationCap size={32} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-gray-900">
          Complete Your Academic Setup
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
          Your current institution, academic program or semester has not been
          configured yet. Complete your academic profile to access your
          dashboard.
        </p>

        <Link
          to="/profile"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Complete Profile <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const {
    institution,
    program,
    semester,
    today,
    summary,
    subjectAttendance = [],
    totalSubjects = 0,
    attendanceTarget = 75,
    performance,
  } = dashboard;

  const overallPercentage = getPercentage(
    summary?.present || 0,
    summary?.absent || 0,
  );

  const firstName = user?.name?.split(" ")[0] || "Student";

  const stats = [
    {
      title: "Overall Attendance",
      value: `${overallPercentage}%`,
      subtitle: `Target: ${attendanceTarget}%`,
      icon: ChartNoAxesCombined,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Total Subjects",
      value: totalSubjects,
      subtitle: "Current semester",
      icon: BookOpen,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Classes Attended",
      value: summary?.present || 0,
      subtitle: `${summary?.countedClasses || 0} counted classes`,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Classes Missed",
      value: summary?.absent || 0,
      subtitle: "Absent lectures",
      icon: XCircle,
      color: "bg-red-50 text-red-600",
    },
  ];

  const belowTarget = subjectAttendance.filter(
    (subject) => subject.isLowAttendance,
  );

  const getSubjectColor = (percentage, hasRecords) => {
    if (!hasRecords) return "bg-gray-300";
    if (percentage >= attendanceTarget) return "bg-emerald-500";
    if (percentage >= 65) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-7 pb-10">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            STUDENT OVERVIEW
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {firstName}! Here's your academic overview.
          </p>
        </div>

        <button
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh Dashboard
        </button>
      </div>

      {/* WELCOME BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-200/40 sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-50">
            <Sparkles size={14} />
            Your Academic Journey
          </div>

          <h2 className="mt-5 text-2xl font-bold sm:text-3xl">
            Hello, {firstName}! 👋
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100">
            Stay focused, track your academic performance and keep moving
            towards your goals. Every lecture counts!
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium backdrop-blur-sm">
              <Building2 size={16} />
              {institution?.institutionName ||
                institution?.name ||
                "My Institution"}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium backdrop-blur-sm">
              <GraduationCap size={16} />
              {semester?.semesterName ||
                `Semester ${semester?.semesterNumber || ""}`}
            </div>
          </div>
        </div>

        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[45px] border-white/[0.07]" />
        <div className="absolute -bottom-32 right-36 h-64 w-64 rounded-full bg-white/[0.06]" />
        <GraduationCap
          size={150}
          className="absolute bottom-4 right-8 hidden text-white/[0.08] lg:block"
        />
      </section>

      {/* ACADEMIC INFO */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Institution",
            value: institution?.institutionName || institution?.name || "—",
            icon: Building2,
          },
          {
            label: "Academic Program",
            value: program?.programName || program?.name || "—",
            icon: GraduationCap,
          },
          {
            label: "Academic Year",
            value: semester?.academicYear || "—",
            icon: CalendarDays,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex min-w-0 items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                <Icon size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="mt-1 truncate text-sm font-semibold text-gray-800">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* STATISTICS */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">Academic Overview</h2>
          <p className="mt-1 text-xs text-gray-400">
            Your semester performance at a glance
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className={`rounded-xl p-3 ${stat.color}`}>
                    <Icon size={22} />
                  </div>
                  <TrendingUp size={18} className="text-gray-300" />
                </div>

                <p className="mt-5 text-sm font-medium text-gray-500">
                  {stat.title}
                </p>

                <h3 className="mt-1 text-3xl font-bold text-gray-900">
                  {stat.value}
                </h3>

                <p className="mt-2 text-xs text-gray-400">{stat.subtitle}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* OVERALL PROGRESS */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Overall Attendance
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                Your progress towards the semester target
              </p>
            </div>

            <div className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600">
              Target {attendanceTarget}%
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-7 sm:flex-row">
            <div
              className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#6366f1 ${Math.min(overallPercentage, 100) * 3.6}deg, #eef2ff 0deg)`,
              }}
            >
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
                <p className="text-3xl font-bold text-gray-900">
                  {overallPercentage}%
                </p>
                <p className="mt-1 text-xs text-gray-400">Attendance</p>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-600">Present</span>
                  <span className="font-bold text-emerald-600">
                    {summary?.present || 0}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${
                        summary?.countedClasses
                          ? (summary.present / summary.countedClasses) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-600">Absent</span>
                  <span className="font-bold text-red-600">
                    {summary?.absent || 0}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{
                      width: `${
                        summary?.countedClasses
                          ? (summary.absent / summary.countedClasses) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-600">Class Off</span>
                  <span className="font-bold text-orange-600">
                    {summary?.classOff || 0}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Excluded from attendance percentage
                </p>
              </div>
            </div>
          </div>

          <div
            className={`mt-7 flex items-center gap-2 rounded-xl p-4 ${
              overallPercentage >= attendanceTarget
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {overallPercentage >= attendanceTarget ? (
              <CheckCircle2 size={19} />
            ) : (
              <AlertCircle size={19} />
            )}

            <p className="text-sm font-semibold">
              {overallPercentage >= attendanceTarget
                ? "Great! You have achieved your attendance target."
                : "Your overall attendance is below the required target."}
            </p>
          </div>
        </div>

        {/* QUICK SUMMARY */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Performance Summary
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Subject attendance status
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-red-50 p-4">
              <div>
                <p className="text-xs text-red-600">Below Target</p>
                <p className="mt-1 text-2xl font-bold text-red-700">
                  {performance?.subjectsBelowTarget || 0}
                </p>
              </div>
              <AlertCircle size={25} className="text-red-500" />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4">
              <div>
                <p className="text-xs text-emerald-600">Target Achieved</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  {performance?.subjectsAchievedTarget || 0}
                </p>
              </div>
              <CheckCircle2 size={25} className="text-emerald-500" />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div>
                <p className="text-xs text-gray-500">No Records</p>
                <p className="mt-1 text-2xl font-bold text-gray-700">
                  {performance?.subjectsWithoutRecords || 0}
                </p>
              </div>
              <BookOpen size={25} className="text-gray-400" />
            </div>
          </div>

          <Link
            to="/reports"
            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            View Full Reports <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* SUBJECT ATTENDANCE */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Subject-wise Attendance
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Monitor attendance in every subject
            </p>
          </div>

          <Link
            to="/reports"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View Reports <ArrowRight size={15} />
          </Link>
        </div>

        {subjectAttendance.length > 0 ? (
          <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {subjectAttendance.map((subject) => {
              const percentage = Number(subject.attendancePercentage || 0);
              const isLow = subject.isLowAttendance;
              const hasRecords = subject.hasRecords;

              return (
                <div
                  key={subject.subjectId}
                  className="rounded-xl border border-gray-100 p-4 transition hover:border-indigo-100 hover:bg-gray-50/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-gray-800">
                        {subject.subjectName}
                      </h3>
                      <p className="mt-1 text-xs text-gray-400">
                        {subject.subjectCode || "No subject code"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={`text-lg font-bold ${
                          !hasRecords
                            ? "text-gray-400"
                            : isLow
                              ? "text-red-600"
                              : "text-emerald-600"
                        }`}
                      >
                        {hasRecords ? `${percentage}%` : "—"}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {hasRecords
                          ? isLow
                            ? "Below target"
                            : "Target achieved"
                          : "No records"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${getSubjectColor(percentage, hasRecords)}`}
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                    <span className="text-emerald-600">
                      Present: <strong>{subject.present}</strong>
                    </span>
                    <span className="text-red-600">
                      Absent: <strong>{subject.absent}</strong>
                    </span>
                    <span className="text-orange-600">
                      Class Off: <strong>{subject.classOff}</strong>
                    </span>
                  </div>

                  {isLow && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-medium text-red-600">
                      <AlertCircle size={14} />
                      Attendance below {attendanceTarget}% target
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <BookOpen size={35} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No subjects found for this semester.
            </p>
          </div>
        )}
      </section>

      {/* TODAY'S CLASSES */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays size={20} className="text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">
                Today's Classes
              </h2>
            </div>

            <p className="mt-1 text-xs text-gray-400">
              {formatDate(today?.date)}
            </p>
          </div>

          <Link
            to="/timetable"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Full Timetable <ArrowRight size={15} />
          </Link>
        </div>

        {today?.lectures?.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {today.lectures.map((item) => {
              const status = getAttendanceStatus(item.status);
              const StatusIcon = status.icon;

              return (
                <div
                  key={item._id}
                  className="rounded-xl border border-gray-100 p-4 transition hover:border-indigo-200 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-gray-800">
                        {item.subjectName}
                      </h3>

                      <p className="mt-1 text-xs text-gray-400">
                        {item.subjectCode || "Lecture"}
                      </p>
                    </div>

                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold ${status.className}`}
                    >
                      <StatusIcon size={12} />
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
                    <Clock3 size={15} className="text-indigo-500" />
                    {formatTime(item.startTime)} – {formatTime(item.endTime)}
                  </div>

                  {item.room && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      <MapPin size={14} />
                      {item.room}
                    </div>
                  )}

                  {item.teacherName && (
                    <p className="mt-2 text-xs text-gray-400">
                      Faculty: {item.teacherName}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
            <CalendarDays size={35} className="mx-auto text-gray-300" />
            <h3 className="mt-3 text-sm font-semibold text-gray-700">
              No Classes Scheduled Today
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              Enjoy your free time or use it for self-study.
            </p>
          </div>
        )}
      </section>

      {/* ATTENDANCE ALERT */}
      {belowTarget.length > 0 && (
        <section className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 text-red-600">
              <AlertCircle size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-red-800">
                Attendance Needs Attention
              </h2>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {belowTarget.length} subject(s) are below your required{" "}
                {attendanceTarget}% attendance target.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {belowTarget.map((subject) => (
                  <span
                    key={subject.subjectId}
                    className="rounded-lg border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-red-700"
                  >
                    {subject.subjectName} · {subject.attendancePercentage}%
                  </span>
                ))}
              </div>

              <Link
                to="/reports"
                className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-red-700 hover:text-red-900"
              >
                Review Performance <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* QUICK ACTIONS */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-900">Quick Access</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "My Subjects",
              description: "Explore your enrolled subjects",
              icon: BookOpen,
              to: "/subjects",
            },
            {
              title: "My Timetable",
              description: "Check your weekly schedule",
              icon: CalendarDays,
              to: "/timetable",
            },
            {
              title: "Attendance",
              description: "View and manage your records",
              icon: ClipboardList,
              to: "/attendance",
            },
            {
              title: "My Reports",
              description: "Review your academic performance",
              icon: Target,
              to: "/reports",
            },
          ].map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                to={action.to}
                className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-indigo-100 hover:shadow-md"
              >
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                  <Icon size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-gray-800">
                    {action.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-400">
                    {action.description}
                  </p>
                </div>

                <ArrowRight
                  size={16}
                  className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-indigo-600"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
        <GraduationCap size={19} className="mt-0.5 shrink-0 text-indigo-600" />

        <p className="text-xs leading-5 text-indigo-800">
          Your attendance percentage is calculated using Present and Absent
          records only. Class Off records are excluded from the calculation.
          Keep attending your lectures and stay on track with your academic
          goals.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
