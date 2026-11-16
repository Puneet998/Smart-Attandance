// import { useCallback, useEffect, useMemo, useState } from "react";
// import {
//   CalendarDays,
//   ChevronLeft,
//   ChevronRight,
//   CheckCircle2,
//   XCircle,
//   Clock3,
//   BookOpen,
//   AlertCircle,
//   Loader2,
//   RefreshCw,
//   CheckSquare,
//   Square,
//   ClipboardCheck,
//   Ban,
//   GraduationCap,
// } from "lucide-react";
// import toast from "react-hot-toast";
// import api from "../../services/api";

// // ==========================================
// // INDIA DATE / TIME HELPERS
// // ==========================================

// const TIME_ZONE = "Asia/Kolkata";

// const getIndiaDate = () => {
//   const parts = new Intl.DateTimeFormat("en-CA", {
//     timeZone: TIME_ZONE,
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   }).formatToParts(new Date());

//   const values = {};
//   parts.forEach((part) => {
//     values[part.type] = part.value;
//   });

//   return `${values.year}-${values.month}-${values.day}`;
// };

// const getIndiaMinutes = () => {
//   const parts = new Intl.DateTimeFormat("en-GB", {
//     timeZone: TIME_ZONE,
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//     hourCycle: "h23",
//   }).formatToParts(new Date());

//   const values = {};
//   parts.forEach((part) => {
//     values[part.type] = Number(part.value);
//   });

//   return values.hour * 60 + values.minute + values.second / 60;
// };

// const pad = (value) => String(value).padStart(2, "0");

// const dayName = (value) =>
//   new Date(`${value}T12:00:00.000Z`)
//     .toLocaleDateString("en-US", {
//       weekday: "long",
//       timeZone: "UTC",
//     })
//     .toLowerCase();

// const displayDate = (value) =>
//   new Date(`${value}T12:00:00.000Z`).toLocaleDateString("en-IN", {
//     weekday: "long",
//     day: "numeric",
//     month: "long",
//     year: "numeric",
//     timeZone: "UTC",
//   });

// const displayTime = (value = "") => {
//   if (!value) return "";

//   const [hours, minutes] = value.split(":").map(Number);

//   const date = new Date();
//   date.setHours(hours, minutes, 0, 0);

//   return date.toLocaleTimeString("en-IN", {
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   });
// };

// const timeToMinutes = (value) => {
//   if (!/^\d{2}:\d{2}$/.test(value || "")) return null;

//   const [hours, minutes] = value.split(":").map(Number);

//   if (hours > 23 || minutes > 59) return null;

//   return hours * 60 + minutes;
// };

// const formatMinutes = (minutes) => {
//   const hours = Math.floor(minutes / 60);
//   const mins = Math.floor(minutes % 60);

//   return `${pad(hours)}:${pad(mins)}`;
// };

// const idOf = (value) => value?._id || value?.id || value;

// const arrayFrom = (response, keys = []) => {
//   const data = response?.data;

//   if (Array.isArray(data)) return data;
//   if (Array.isArray(data?.data)) return data.data;

//   for (const key of keys) {
//     if (Array.isArray(data?.[key])) return data[key];
//     if (Array.isArray(data?.data?.[key])) return data.data[key];
//   }

//   if (Array.isArray(data?.items)) return data.items;
//   if (Array.isArray(data?.results)) return data.results;

//   return [];
// };

// const objectFrom = (response, keys = []) => {
//   const data = response?.data;

//   if (!data) return null;

//   for (const key of keys) {
//     if (data[key] && !Array.isArray(data[key])) {
//       return data[key];
//     }
//   }

//   if (data.data && !Array.isArray(data.data)) {
//     return data.data;
//   }

//   return data;
// };

// const getSemesterDate = (value) => {
//   if (!value) return null;

//   // Semester dates are stored as UTC-midnight date markers.
//   return new Date(value).toISOString().slice(0, 10);
// };

// // Count recurring timetable lectures between semester start
// // and today (or semester end), using UTC calendar dates.
// const countScheduledLectures = (timetable, startDate, endDate) => {
//   if (!startDate || !endDate) return 0;

//   const today = getIndiaDate();
//   const lastDate = today < endDate ? today : endDate;

//   if (lastDate < startDate) return 0;

//   const activeDays = new Set(
//     timetable
//       .filter(
//         (item) => item.status === "active" && item.entryType === "lecture",
//       )
//       .map((item) => String(item.dayOfWeek).toLowerCase()),
//   );

//   let total = 0;

//   const current = new Date(`${startDate}T12:00:00.000Z`);
//   const last = new Date(`${lastDate}T12:00:00.000Z`);

//   while (current <= last) {
//     const weekday = current
//       .toLocaleDateString("en-US", {
//         weekday: "long",
//         timeZone: "UTC",
//       })
//       .toLowerCase();

//     if (activeDays.has(weekday)) {
//       total += timetable.filter(
//         (item) =>
//           item.status === "active" &&
//           item.entryType === "lecture" &&
//           String(item.dayOfWeek).toLowerCase() === weekday,
//       ).length;
//     }

//     current.setUTCDate(current.getUTCDate() + 1);
//   }

//   return total;
// };

// // ==========================================
// // STATUS CONFIGURATION
// // ==========================================

// const styles = {
//   present: {
//     label: "Present",
//     Icon: CheckCircle2,
//     badge: "bg-emerald-50 text-emerald-700",
//     card: "border-emerald-200 bg-emerald-50/30",
//   },
//   absent: {
//     label: "Absent",
//     Icon: XCircle,
//     badge: "bg-rose-50 text-rose-700",
//     card: "border-rose-200 bg-rose-50/30",
//   },
//   lecture_off: {
//     label: "Class Off",
//     Icon: Ban,
//     badge: "bg-orange-50 text-orange-700",
//     card: "border-orange-200 bg-orange-50/30",
//   },
// };

// // ==========================================
// // REUSABLE STAT CARD
// // ==========================================

// function StatCard({ label, value, icon: Icon, color }) {
//   const colorClasses = {
//     indigo: "bg-indigo-50 text-indigo-700",
//     emerald: "bg-emerald-50 text-emerald-700",
//     rose: "bg-rose-50 text-rose-700",
//     orange: "bg-orange-50 text-orange-700",
//     amber: "bg-amber-50 text-amber-700",
//   };

//   return (
//     <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//       <div className="flex items-center justify-between gap-2">
//         <p className="text-sm text-slate-500">{label}</p>

//         <div className={`rounded-xl p-2 ${colorClasses[color]}`}>
//           <Icon size={19} />
//         </div>
//       </div>

//       <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
//     </div>
//   );
// }

// // ==========================================
// // MAIN COMPONENT
// // ==========================================

// export default function Attendance() {
//   const [today, setToday] = useState(getIndiaDate());
//   const [currentMinutes, setCurrentMinutes] = useState(getIndiaMinutes());

//   const [selectedDate, setSelectedDate] = useState(getIndiaDate());

//   const [semester, setSemester] = useState(null);
//   const [timetable, setTimetable] = useState([]);
//   const [records, setRecords] = useState([]);
//   const [summary, setSummary] = useState(null);

//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   const [submittingId, setSubmittingId] = useState(null);
//   const [bulkSubmitting, setBulkSubmitting] = useState(false);

//   const [selectedLectures, setSelectedLectures] = useState({});
//   const [bulkStatuses, setBulkStatuses] = useState({});

//   const [pageError, setPageError] = useState("");

//   // ==========================================
//   // LIVE INDIA CLOCK
//   // ==========================================

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setToday(getIndiaDate());
//       setCurrentMinutes(getIndiaMinutes());
//     }, 1000);

//     return () => clearInterval(interval);
//   }, []);

//   // ==========================================
//   // LOAD SEMESTER
//   // ==========================================

//   const loadSemester = useCallback(async () => {
//     const institutionRes = await api.get("/institutions");

//     const institutions = arrayFrom(institutionRes, ["institutions"]);

//     const institution =
//       institutions.find((item) => item.isCurrent) || institutions[0];

//     if (!institution) {
//       throw new Error("No institution is linked to your account.");
//     }

//     const programsRes = await api.get(
//       `/academic-programs?institution=${idOf(institution)}`,
//     );

//     const programs = arrayFrom(programsRes, ["programs", "academicPrograms"]);

//     const program = programs.find((item) => item.isCurrent) || programs[0];

//     if (!program) {
//       throw new Error("No academic program found.");
//     }

//     const semesterRes = await api.get(
//       `/semesters/program/${idOf(program)}/current`,
//     );

//     const current = objectFrom(semesterRes, ["semester"]);

//     const semesterData = current?.semester || current;

//     if (!semesterData?._id) {
//       throw new Error("No current semester found.");
//     }

//     setSemester(semesterData);

//     return semesterData;
//   }, []);

//   // ==========================================
//   // LOAD ALL ATTENDANCE DATA
//   // ==========================================

//   const loadData = useCallback(async (currentSemester, withLoader = true) => {
//     if (!currentSemester?._id) return;

//     if (withLoader) setLoading(true);

//     try {
//       const sid = idOf(currentSemester);

//       const [timetableRes, attendanceRes, summaryRes] = await Promise.all([
//         api.get(`/timetables/semester/${sid}`),
//         api.get(`/attendance/semester/${sid}`),
//         api.get(`/attendance/summary/${sid}`),
//       ]);

//       const timetableData = arrayFrom(timetableRes, [
//         "timetable",
//         "timetables",
//         "records",
//       ]);

//       const attendanceData = arrayFrom(attendanceRes, [
//         "records",
//         "attendance",
//         "attendances",
//       ]);

//       const summaryData = objectFrom(summaryRes, ["summary"]);

//       setTimetable(timetableData);
//       setRecords(attendanceData);
//       setSummary(summaryData?.summary || summaryData);
//     } catch (error) {
//       toast.error(
//         error?.response?.data?.message || "Unable to load attendance details.",
//       );
//     } finally {
//       if (withLoader) setLoading(false);
//     }
//   }, []);

//   // ==========================================
//   // INITIAL PAGE LOAD
//   // ==========================================

//   const loadPage = useCallback(async () => {
//     try {
//       setLoading(true);
//       setPageError("");

//       const current = await loadSemester();

//       await loadData(current, false);
//     } catch (error) {
//       const message =
//         error?.response?.data?.message ||
//         error.message ||
//         "Unable to load attendance.";

//       setPageError(message);
//       toast.error(message);
//     } finally {
//       setLoading(false);
//     }
//   }, [loadSemester, loadData]);

//   useEffect(() => {
//     loadPage();
//   }, [loadPage]);

//   // ==========================================
//   // SEMESTER DATE STATE
//   // ==========================================

//   const semesterStart = semester?.startDate
//     ? getSemesterDate(semester.startDate)
//     : null;

//   const semesterEnd = semester?.endDate
//     ? getSemesterDate(semester.endDate)
//     : null;

//   const semesterState = useMemo(() => {
//     if (!semester) return "missing";

//     if (!semesterStart || !semesterEnd) return "invalid";

//     if (today < semesterStart) return "upcoming";

//     if (today > semesterEnd || semester.status === "completed") {
//       return "completed";
//     }

//     if (semester.status !== "current") return "inactive";

//     return "active";
//   }, [semester, semesterStart, semesterEnd, today]);

//   // ==========================================
//   // SELECTED DATE LECTURES
//   // ==========================================

//   const lectures = useMemo(() => {
//     return timetable
//       .filter(
//         (item) =>
//           item.status === "active" &&
//           item.entryType === "lecture" &&
//           String(item.dayOfWeek).toLowerCase() === dayName(selectedDate),
//       )
//       .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
//   }, [timetable, selectedDate]);

//   // ==========================================
//   // FIND ATTENDANCE RECORD
//   // ==========================================

//   const recordFor = useCallback(
//     (lecture) =>
//       records.find(
//         (record) =>
//           String(idOf(record.timetable)) === String(idOf(lecture)) &&
//           String(record.classDate).slice(0, 10) === selectedDate,
//       ),
//     [records, selectedDate],
//   );

//   // ==========================================
//   // LECTURE WINDOW
//   // ==========================================

//   const getLectureWindow = useCallback(
//     (lecture) => {
//       const start = timeToMinutes(lecture.startTime);
//       const end = timeToMinutes(lecture.endTime);

//       if (start === null || end === null || end <= start) {
//         return {
//           open: false,
//           reason: "Invalid lecture timing",
//         };
//       }

//       if (selectedDate > today) {
//         return {
//           open: false,
//           reason: "Future date attendance cannot be marked",
//         };
//       }

//       if (selectedDate < semesterStart || selectedDate > semesterEnd) {
//         return {
//           open: false,
//           reason: "Date is outside the semester timeline",
//         };
//       }

//       if (semesterState !== "active") {
//         return {
//           open: false,
//           reason: "Semester is not active",
//         };
//       }

//       // Previous lecture dates can be marked at any time.
//       if (selectedDate < today) {
//         return {
//           open: true,
//           reason: "Past lecture attendance available",
//         };
//       }

//       const openTime = Math.max(start, end - 10);

//       if (currentMinutes < openTime) {
//         return {
//           open: false,
//           reason: `Attendance opens at ${formatMinutes(openTime)}`,
//         };
//       }

//       return {
//         open: true,
//         reason: "Attendance is open",
//       };
//     },
//     [
//       selectedDate,
//       today,
//       currentMinutes,
//       semesterState,
//       semesterStart,
//       semesterEnd,
//     ],
//   );

//   // ==========================================
//   // SELECTED DAY COUNTS
//   // ==========================================

//   const counts = useMemo(() => {
//     let present = 0;
//     let absent = 0;
//     let off = 0;

//     lectures.forEach((lecture) => {
//       const status = recordFor(lecture)?.status;

//       if (status === "present") present++;
//       else if (status === "absent") absent++;
//       else if (status === "lecture_off") off++;
//     });

//     const marked = present + absent + off;

//     return {
//       total: lectures.length,
//       present,
//       absent,
//       off,
//       pending: Math.max(lectures.length - marked, 0),
//       marked,
//     };
//   }, [lectures, recordFor]);

//   // ==========================================
//   // OVERALL SEMESTER COUNTS
//   // ==========================================

//   const overallCounts = useMemo(() => {
//     const present = Number(summary?.present || 0);
//     const absent = Number(summary?.absent || 0);
//     const off = Number(summary?.lectureOff || 0);

//     const total = countScheduledLectures(timetable, semesterStart, semesterEnd);

//     const conducted = present + absent;

//     const marked = present + absent + off;

//     return {
//       total,
//       present,
//       absent,
//       off,
//       conducted,
//       pending: Math.max(total - marked, 0),
//       percentage: conducted
//         ? Number(((present / conducted) * 100).toFixed(2))
//         : 0,
//     };
//   }, [summary, timetable, semesterStart, semesterEnd]);

//   // ==========================================
//   // INDIVIDUAL ATTENDANCE
//   // ==========================================

//   const submitAttendance = async (lecture, status) => {
//     const existing = recordFor(lecture);

//     if (!["present", "absent", "lecture_off"].includes(status)) {
//       return toast.error("Invalid attendance status.");
//     }

//     const window = getLectureWindow(lecture);

//     if (!window.open) {
//       return toast.error(window.reason);
//     }

//     const timetableId = idOf(lecture);
//     const statusLabel = styles[status]?.label || status;

//     try {
//       setSubmittingId(timetableId);

//       if (existing) {
//         // Existing record: update the student's own attendance status.
//         await api.patch(`/attendance/${idOf(existing)}`, { status });
//         toast.success(`Attendance updated to ${statusLabel}.`);
//       } else {
//         // No record exists: create a new attendance entry.
//         await api.post("/attendance", {
//           semester: idOf(semester),
//           timetableId,
//           classDate: selectedDate,
//           status,
//         });
//         toast.success(`${statusLabel} marked successfully.`);
//       }

//       // Remove this lecture from bulk selection after a successful save.
//       setSelectedLectures((previous) => {
//         const updated = { ...previous };
//         delete updated[String(timetableId)];
//         return updated;
//       });

//       await loadData(semester, false);
//     } catch (error) {
//       toast.error(
//         error?.response?.data?.message || "Could not save attendance.",
//       );
//     } finally {
//       setSubmittingId(null);
//     }
//   };

//   // ==========================================
//   // BULK SELECTION
//   // ==========================================

//   const toggleLectureSelection = (lecture) => {
//     const tid = String(idOf(lecture));

//     const window = getLectureWindow(lecture);

//     if (!window.open || recordFor(lecture)) return;

//     setSelectedLectures((previous) => {
//       const updated = { ...previous };

//       if (updated[tid]) {
//         delete updated[tid];
//       } else {
//         updated[tid] = true;
//       }

//       return updated;
//     });

//     setBulkStatuses((previous) => ({
//       ...previous,
//       [tid]: previous[tid] || "present",
//     }));
//   };

//   const selectAllAvailable = () => {
//     const available = lectures.filter(
//       (lecture) => !recordFor(lecture) && getLectureWindow(lecture).open,
//     );

//     if (!available.length) {
//       return toast.error("No lectures are currently available.");
//     }

//     const allSelected = available.every(
//       (lecture) => selectedLectures[String(idOf(lecture))],
//     );

//     if (allSelected) {
//       setSelectedLectures({});
//       setBulkStatuses({});
//       return;
//     }

//     const selection = {};
//     const statuses = {};

//     available.forEach((lecture) => {
//       const tid = String(idOf(lecture));

//       selection[tid] = true;
//       statuses[tid] = bulkStatuses[tid] || "present";
//     });

//     setSelectedLectures(selection);
//     setBulkStatuses(statuses);
//   };

//   const updateBulkStatus = (timetableId, status) => {
//     setBulkStatuses((previous) => ({
//       ...previous,
//       [timetableId]: status,
//     }));
//   };

//   // ==========================================
//   // SUBMIT BULK ATTENDANCE
//   // ==========================================

//   const submitBulkAttendance = async () => {
//     const entries = Object.keys(selectedLectures)
//       .filter((tid) => selectedLectures[tid])
//       .map((timetableId) => ({
//         timetableId,
//         status: bulkStatuses[timetableId] || "present",
//       }));

//     if (!entries.length) {
//       return toast.error("Please select at least one lecture.");
//     }

//     const selectedStillValid = entries.every((entry) => {
//       const lecture = lectures.find(
//         (item) => String(idOf(item)) === entry.timetableId,
//       );

//       return lecture && !recordFor(lecture) && getLectureWindow(lecture).open;
//     });

//     if (!selectedStillValid) {
//       return toast.error(
//         "One or more selected lectures are no longer available.",
//       );
//     }

//     try {
//       setBulkSubmitting(true);

//       await api.post("/attendance/bulk", {
//         semester: idOf(semester),
//         classDate: selectedDate,
//         entries,
//       });

//       toast.success(
//         `${entries.length} lecture attendance records submitted successfully.`,
//       );

//       setSelectedLectures({});
//       setBulkStatuses({});

//       await loadData(semester, false);
//     } catch (error) {
//       toast.error(
//         error?.response?.data?.message || "Could not submit bulk attendance.",
//       );
//     } finally {
//       setBulkSubmitting(false);
//     }
//   };

//   // ==========================================
//   // DATE NAVIGATION
//   // ==========================================

//   const moveDate = (amount) => {
//     const date = new Date(`${selectedDate}T12:00:00.000Z`);

//     date.setUTCDate(date.getUTCDate() + amount);

//     const nextDate = date.toISOString().slice(0, 10);

//     if (nextDate > today) return;
//     if (semesterStart && nextDate < semesterStart) return;

//     setSelectedDate(nextDate);
//     setSelectedLectures({});
//     setBulkStatuses({});
//   };

//   const refresh = async () => {
//     if (!semester) return;

//     setRefreshing(true);

//     await loadData(semester, false);

//     setRefreshing(false);
//   };

//   // ==========================================
//   // BULK / COUNTS
//   // ==========================================

//   const selectedCount = Object.values(selectedLectures).filter(Boolean).length;

//   const availableCount = lectures.filter(
//     (lecture) => !recordFor(lecture) && getLectureWindow(lecture).open,
//   ).length;

//   // ==========================================
//   // LOADING
//   // ==========================================

//   if (loading) {
//     return (
//       <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
//         <div className="text-center">
//           <Loader2 className="mx-auto animate-spin text-indigo-600" size={34} />
//           <p className="mt-3 text-sm text-slate-500">Loading attendance...</p>
//         </div>
//       </main>
//     );
//   }

//   // ==========================================
//   // NO SEMESTER
//   // ==========================================

//   if (!semester) {
//     return (
//       <main className="mx-auto max-w-7xl py-12">
//         <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
//           <AlertCircle size={36} className="mx-auto text-amber-500" />

//           <h2 className="mt-4 text-xl font-semibold text-slate-900">
//             Semester Not Available
//           </h2>

//           <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
//             {pageError || "No current semester is linked to your account."}
//           </p>

//           <button
//             onClick={loadPage}
//             className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
//           >
//             Try Again
//           </button>
//         </div>
//       </main>
//     );
//   }

//   // ==========================================
//   // SEMESTER NOT STARTED / ENDED
//   // ==========================================

//   if (semesterState !== "active") {
//     const upcoming = semesterState === "upcoming";

//     const title = upcoming
//       ? "Your Semester Has Not Started Yet"
//       : semesterState === "completed"
//         ? "Your Semester Has Ended"
//         : "Semester Not Active";

//     const description = upcoming
//       ? `Your semester will start on ${semesterStart}.`
//       : semesterState === "completed"
//         ? `Your semester ended on ${semesterEnd}.`
//         : "Your semester is not currently active.";

//     return (
//       <main className="mx-auto max-w-7xl py-12">
//         <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
//           <CalendarDays size={42} className="mx-auto text-indigo-500" />

//           <h2 className="mt-4 text-xl font-semibold text-slate-900">{title}</h2>

//           <p className="mt-2 text-sm text-slate-500">{description}</p>
//         </div>
//       </main>
//     );
//   }

//   // ==========================================
//   // MAIN ATTENDANCE UI
//   // ==========================================

//   return (
//     <main className="mx-auto w-full max-w-7xl space-y-6 pb-8">
//       {/* HEADER */}

//       <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
//         <div>
//           <p className="text-sm font-medium text-indigo-600">Student Portal</p>

//           <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
//             Attendance
//           </h1>

//           <p className="mt-1 text-sm text-slate-500">
//             View your lectures and manage your attendance.
//           </p>
//         </div>

//         <button
//           onClick={refresh}
//           disabled={refreshing}
//           className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
//         >
//           <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
//           Refresh
//         </button>
//       </header>

//       {/* OVERALL ATTENDANCE */}

//       <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <p className="text-sm text-slate-500">
//               Overall Semester Attendance
//             </p>

//             <h2 className="mt-1 text-3xl font-bold text-slate-900">
//               {overallCounts.percentage.toFixed(1)}%
//             </h2>

//             <p className="mt-1 text-xs text-slate-500">
//               Present ÷ (Present + Absent). Class Off excluded.
//             </p>
//           </div>

//           <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
//             <GraduationCap size={25} />
//           </div>
//         </div>

//         <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
//           <div
//             className="h-full rounded-full bg-indigo-600 transition-all"
//             style={{
//               width: `${Math.min(Math.max(overallCounts.percentage, 0), 100)}%`,
//             }}
//           />
//         </div>

//         <p className="mt-2 text-xs text-slate-500">
//           {overallCounts.present} Present out of {overallCounts.conducted}{" "}
//           conducted lectures
//         </p>
//       </section>

//       {/* OVERALL COUNTS */}

//       <section>
//         <div className="mb-3">
//           <h2 className="font-semibold text-slate-900">
//             Overall Lecture Summary
//           </h2>

//           <p className="mt-1 text-xs text-slate-500">
//             Semester start se aaj tak ke scheduled lectures aur attendance
//             records.
//           </p>
//         </div>

//         <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
//           <StatCard
//             label="Total Lectures"
//             value={overallCounts.total}
//             icon={BookOpen}
//             color="indigo"
//           />

//           <StatCard
//             label="Total Present"
//             value={overallCounts.present}
//             icon={CheckCircle2}
//             color="emerald"
//           />

//           <StatCard
//             label="Total Absent"
//             value={overallCounts.absent}
//             icon={XCircle}
//             color="rose"
//           />

//           <StatCard
//             label="Total Class Off"
//             value={overallCounts.off}
//             icon={Ban}
//             color="orange"
//           />

//           <StatCard
//             label="Total Pending"
//             value={overallCounts.pending}
//             icon={Clock3}
//             color="amber"
//           />
//         </div>
//       </section>

//       {/* SELECTED DAY COUNTS */}

//       <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//         <div className="mb-4">
//           <h2 className="font-semibold text-slate-900">Selected Day Summary</h2>

//           <p className="mt-1 text-xs text-slate-500">
//             {displayDate(selectedDate)} · {counts.total} scheduled lectures
//           </p>
//         </div>

//         <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
//           <StatCard
//             label="Total"
//             value={counts.total}
//             icon={BookOpen}
//             color="indigo"
//           />

//           <StatCard
//             label="Present"
//             value={counts.present}
//             icon={CheckCircle2}
//             color="emerald"
//           />

//           <StatCard
//             label="Absent"
//             value={counts.absent}
//             icon={XCircle}
//             color="rose"
//           />

//           <StatCard
//             label="Class Off"
//             value={counts.off}
//             icon={Ban}
//             color="orange"
//           />

//           <StatCard
//             label="Pending"
//             value={counts.pending}
//             icon={Clock3}
//             color="amber"
//           />
//         </div>
//       </section>

//       {/* DATE SELECTOR */}

//       <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
//         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//           <div className="flex items-center gap-3">
//             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
//               <CalendarDays size={21} />
//             </div>

//             <div>
//               <p className="text-xs text-slate-500">Selected date</p>

//               <h2 className="mt-0.5 font-semibold text-slate-900">
//                 {displayDate(selectedDate)}
//               </h2>
//             </div>
//           </div>

//           <div className="flex flex-wrap items-center gap-2">
//             <button
//               onClick={() => moveDate(-1)}
//               disabled={selectedDate <= semesterStart}
//               aria-label="Previous day"
//               className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
//             >
//               <ChevronLeft size={19} />
//             </button>

//             <button
//               onClick={() => {
//                 setSelectedDate(today);
//                 setSelectedLectures({});
//                 setBulkStatuses({});
//               }}
//               className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
//             >
//               Today
//             </button>

//             <button
//               onClick={() => moveDate(1)}
//               disabled={selectedDate >= today}
//               aria-label="Next day"
//               className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
//             >
//               <ChevronRight size={19} />
//             </button>

//             <input
//               type="date"
//               value={selectedDate}
//               max={today}
//               min={semesterStart || undefined}
//               onChange={(event) => {
//                 const value = event.target.value;

//                 if (!value) return;

//                 if (value > today) {
//                   return toast.error("Future date is not allowed.");
//                 }

//                 if (value < semesterStart || value > semesterEnd) {
//                   return toast.error(
//                     "Please select a date within the semester.",
//                   );
//                 }

//                 setSelectedDate(value);
//                 setSelectedLectures({});
//                 setBulkStatuses({});
//               }}
//               className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
//             />
//           </div>
//         </div>
//       </section>

//       {/* LECTURES HEADER */}

//       <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
//         <div>
//           <h2 className="text-lg font-semibold text-slate-900">
//             {selectedDate === today ? "Today's Lectures" : "Lecture History"}
//           </h2>

//           <p className="mt-1 text-sm text-slate-500">
//             {lectures.length} lecture(s) scheduled
//           </p>
//         </div>

//         <p className="text-xs font-medium text-slate-500">
//           {counts.marked} of {lectures.length} marked
//         </p>
//       </div>

//       {/* BULK ACTIONS */}

//       {availableCount > 0 && (
//         <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
//           <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//             <div>
//               <p className="font-semibold text-slate-900">Bulk Attendance</p>

//               <p className="mt-1 text-xs text-slate-600">
//                 Select multiple lectures and choose Present, Absent or Class Off
//                 for each.
//               </p>
//             </div>

//             <div className="flex flex-wrap items-center gap-2">
//               <button
//                 onClick={selectAllAvailable}
//                 className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
//               >
//                 <CheckSquare size={16} />
//                 Select All Available
//               </button>

//               <button
//                 onClick={submitBulkAttendance}
//                 disabled={selectedCount === 0 || bulkSubmitting}
//                 className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
//               >
//                 {bulkSubmitting ? (
//                   <Loader2 size={16} className="animate-spin" />
//                 ) : (
//                   <ClipboardCheck size={16} />
//                 )}
//                 Submit ({selectedCount})
//               </button>
//             </div>
//           </div>
//         </section>
//       )}

//       {/* NO LECTURES */}

//       {!lectures.length ? (
//         <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
//           <CalendarDays className="mx-auto text-slate-300" size={36} />

//           <h3 className="mt-3 font-semibold text-slate-800">
//             No Lectures Scheduled
//           </h3>

//           <p className="mt-1 text-sm text-slate-500">
//             There are no lectures in your timetable for this day.
//           </p>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {lectures.map((lecture, index) => {
//             const record = recordFor(lecture);

//             const config = record ? styles[record.status] : null;

//             const Icon = config?.Icon;

//             const subject = lecture.subject || {};
//             const tid = String(idOf(lecture));

//             const busy = submittingId === tid;
//             const window = getLectureWindow(lecture);
//             const selected = Boolean(selectedLectures[tid]);

//             return (
//               <article
//                 key={tid}
//                 className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${
//                   config
//                     ? config.card
//                     : selected
//                       ? "border-indigo-300 bg-indigo-50/30"
//                       : "border-slate-200"
//                 }`}
//               >
//                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//                   <div className="flex min-w-0 items-start gap-3">
//                     {/* BULK CHECKBOX */}

//                     {!record && window.open && (
//                       <button
//                         onClick={() => toggleLectureSelection(lecture)}
//                         aria-label={
//                           selected ? "Deselect lecture" : "Select lecture"
//                         }
//                         className="mt-2 shrink-0 text-indigo-600"
//                       >
//                         {selected ? (
//                           <CheckSquare size={21} />
//                         ) : (
//                           <Square size={21} />
//                         )}
//                       </button>
//                     )}

//                     <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
//                       <BookOpen size={21} />
//                     </div>

//                     <div className="min-w-0">
//                       <div className="flex flex-wrap items-center gap-2">
//                         <h3 className="font-semibold text-slate-900">
//                           {subject.subjectName || "Subject"}
//                         </h3>

//                         {subject.subjectCode && (
//                           <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
//                             {subject.subjectCode}
//                           </span>
//                         )}
//                       </div>

//                       <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
//                         <span className="inline-flex items-center gap-1.5">
//                           <Clock3 size={14} />
//                           {displayTime(lecture.startTime)} –{" "}
//                           {displayTime(lecture.endTime)}
//                         </span>

//                         <span>Lecture {index + 1}</span>

//                         {subject.teacherName && (
//                           <span>{subject.teacherName}</span>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {/* STATUS BADGE */}

//                   {config ? (
//                     <span
//                       className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${config.badge}`}
//                     >
//                       <Icon size={14} />
//                       {config.label}
//                     </span>
//                   ) : (
//                     <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
//                       <Clock3 size={14} />
//                       Pending
//                     </span>
//                   )}
//                 </div>

//                 {/* CARD FOOTER */}

//                 <div className="mt-4 border-t border-slate-100 pt-4">
//                   {record ? (
//                     <div className="space-y-3">
//                       <div className="flex flex-wrap items-center justify-between gap-2">
//                         <p className="text-xs text-slate-500">
//                           {record.status === "lecture_off"
//                             ? "You marked this lecture as Class Off."
//                             : `You marked this lecture as ${styles[record.status]?.label || record.status}.`}

//                           {record.markedAt
//                             ? ` · ${new Date(record.markedAt).toLocaleString("en-IN")}`
//                             : ""}
//                         </p>

//                         <span className="text-xs font-medium text-slate-500">
//                           You can update your selection
//                         </span>
//                       </div>

//                       {window.open ? (
//                         <div className="grid grid-cols-3 gap-2 sm:ml-auto sm:w-[390px]">
//                           <button
//                             onClick={() => submitAttendance(lecture, "present")}
//                             disabled={busy || record.status === "present"}
//                             className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
//                           >
//                             {busy ? (
//                               <Loader2 size={15} className="animate-spin" />
//                             ) : (
//                               <CheckCircle2 size={15} />
//                             )}
//                             Present
//                           </button>

//                           <button
//                             onClick={() => submitAttendance(lecture, "absent")}
//                             disabled={busy || record.status === "absent"}
//                             className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
//                           >
//                             {busy ? (
//                               <Loader2 size={15} className="animate-spin" />
//                             ) : (
//                               <XCircle size={15} />
//                             )}
//                             Absent
//                           </button>

//                           <button
//                             onClick={() =>
//                               submitAttendance(lecture, "lecture_off")
//                             }
//                             disabled={busy || record.status === "lecture_off"}
//                             className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-2 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
//                           >
//                             {busy ? (
//                               <Loader2 size={15} className="animate-spin" />
//                             ) : (
//                               <Ban size={15} />
//                             )}
//                             Class Off
//                           </button>
//                         </div>
//                       ) : (
//                         <p className="flex items-center gap-2 text-xs text-amber-700">
//                           <Clock3 size={15} />
//                           {window.reason}
//                         </p>
//                       )}
//                     </div>
//                   ) : !window.open ? (
//                     <p className="flex items-center gap-2 text-xs text-amber-700">
//                       <Clock3 size={15} />
//                       {window.reason}
//                     </p>
//                   ) : selected ? (
//                     <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                       <p className="text-xs font-medium text-indigo-700">
//                         Select attendance status for this lecture
//                       </p>

//                       <div className="grid grid-cols-3 gap-2 sm:w-[390px]">
//                         <button
//                           onClick={() => updateBulkStatus(tid, "present")}
//                           className={`rounded-xl border px-2 py-2 text-sm font-semibold ${
//                             bulkStatuses[tid] === "present"
//                               ? "border-emerald-500 bg-emerald-100 text-emerald-800"
//                               : "border-emerald-200 bg-white text-emerald-700"
//                           }`}
//                         >
//                           Present
//                         </button>

//                         <button
//                           onClick={() => updateBulkStatus(tid, "absent")}
//                           className={`rounded-xl border px-2 py-2 text-sm font-semibold ${
//                             bulkStatuses[tid] === "absent"
//                               ? "border-rose-500 bg-rose-100 text-rose-800"
//                               : "border-rose-200 bg-white text-rose-700"
//                           }`}
//                         >
//                           Absent
//                         </button>

//                         <button
//                           onClick={() => updateBulkStatus(tid, "lecture_off")}
//                           className={`rounded-xl border px-2 py-2 text-sm font-semibold ${
//                             bulkStatuses[tid] === "lecture_off"
//                               ? "border-orange-500 bg-orange-100 text-orange-800"
//                               : "border-orange-200 bg-white text-orange-700"
//                           }`}
//                         >
//                           Class Off
//                         </button>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
//                       <p className="mr-auto text-xs text-slate-500">
//                         Attendance window is open
//                       </p>

//                       <div className="grid grid-cols-3 gap-2 sm:w-[390px]">
//                         <button
//                           onClick={() => submitAttendance(lecture, "present")}
//                           disabled={busy}
//                           className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
//                         >
//                           {busy ? (
//                             <Loader2 size={16} className="animate-spin" />
//                           ) : (
//                             <CheckCircle2 size={16} />
//                           )}
//                           Present
//                         </button>

//                         <button
//                           onClick={() => submitAttendance(lecture, "absent")}
//                           disabled={busy}
//                           className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
//                         >
//                           {busy ? (
//                             <Loader2 size={16} className="animate-spin" />
//                           ) : (
//                             <XCircle size={16} />
//                           )}
//                           Absent
//                         </button>

//                         <button
//                           onClick={() =>
//                             submitAttendance(lecture, "lecture_off")
//                           }
//                           disabled={busy}
//                           className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-60"
//                         >
//                           {busy ? (
//                             <Loader2 size={16} className="animate-spin" />
//                           ) : (
//                             <Ban size={16} />
//                           )}
//                           Class Off
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </article>
//             );
//           })}
//         </div>
//       )}

//       {/* FOOTER NOTE */}

//       <p className="text-center text-xs text-slate-400">
//         Attendance opens during the final 10 minutes of today's lecture.
//         Previous lecture dates remain available within the semester. All times
//         are based on Indian Standard Time.
//       </p>
//     </main>
//   );
// }

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock3,
  BookOpen,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckSquare,
  Square,
  ClipboardCheck,
  Ban,
  GraduationCap,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// ==========================================
// INDIA DATE / TIME HELPERS
// ==========================================

const TIME_ZONE = "Asia/Kolkata";

const getIndiaDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = {};
  parts.forEach((part) => {
    values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`;
};

const getIndiaMinutes = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = {};
  parts.forEach((part) => {
    values[part.type] = Number(part.value);
  });

  return values.hour * 60 + values.minute + values.second / 60;
};

const pad = (value) => String(value).padStart(2, "0");

const dayName = (value) =>
  new Date(`${value}T12:00:00.000Z`)
    .toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    })
    .toLowerCase();

const displayDate = (value) =>
  new Date(`${value}T12:00:00.000Z`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const displayTime = (value = "") => {
  if (!value) return "";

  const [hours, minutes] = value.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const timeToMinutes = (value) => {
  if (!/^\d{2}:\d{2}$/.test(value || "")) return null;

  const [hours, minutes] = value.split(":").map(Number);

  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
};

const formatMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);

  return `${pad(hours)}:${pad(mins)}`;
};

const idOf = (value) => value?._id || value?.id || value;

const arrayFrom = (response, keys = []) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data?.[key])) return data.data[key];
  }

  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;

  return [];
};

const objectFrom = (response, keys = []) => {
  const data = response?.data;

  if (!data) return null;

  for (const key of keys) {
    if (data[key] && !Array.isArray(data[key])) {
      return data[key];
    }
  }

  if (data.data && !Array.isArray(data.data)) {
    return data.data;
  }

  return data;
};

const getSemesterDate = (value) => {
  if (!value) return null;

  // Semester dates are stored as UTC-midnight date markers.
  return new Date(value).toISOString().slice(0, 10);
};

// Count recurring timetable lectures between semester start
// and today (or semester end), using UTC calendar dates.
const countScheduledLectures = (timetable, startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const today = getIndiaDate();
  const lastDate = today < endDate ? today : endDate;

  if (lastDate < startDate) return 0;

  const activeDays = new Set(
    timetable
      .filter(
        (item) => item.status === "active" && item.entryType === "lecture",
      )
      .map((item) => String(item.dayOfWeek).toLowerCase()),
  );

  let total = 0;

  const current = new Date(`${startDate}T12:00:00.000Z`);
  const last = new Date(`${lastDate}T12:00:00.000Z`);

  while (current <= last) {
    const weekday = current
      .toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      })
      .toLowerCase();

    if (activeDays.has(weekday)) {
      total += timetable.filter(
        (item) =>
          item.status === "active" &&
          item.entryType === "lecture" &&
          String(item.dayOfWeek).toLowerCase() === weekday,
      ).length;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return total;
};

// ==========================================
// STATUS CONFIGURATION
// ==========================================

const styles = {
  present: {
    label: "Present",
    Icon: CheckCircle2,
    badge: "bg-emerald-50 text-emerald-700",
    card: "border-emerald-200 bg-emerald-50/30",
  },
  absent: {
    label: "Absent",
    Icon: XCircle,
    badge: "bg-rose-50 text-rose-700",
    card: "border-rose-200 bg-rose-50/30",
  },
  lecture_off: {
    label: "Class Off",
    Icon: Ban,
    badge: "bg-orange-50 text-orange-700",
    card: "border-orange-200 bg-orange-50/30",
  },
};

// ==========================================
// REUSABLE STAT CARD
// ==========================================

function StatCard({ label, value, icon: Icon, color }) {
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    orange: "bg-orange-50 text-orange-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{label}</p>

        <div className={`rounded-xl p-2 ${colorClasses[color]}`}>
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function Attendance() {
  const [today, setToday] = useState(getIndiaDate());
  const [currentMinutes, setCurrentMinutes] = useState(getIndiaMinutes());

  const [selectedDate, setSelectedDate] = useState(getIndiaDate());

  const [semester, setSemester] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [submittingId, setSubmittingId] = useState(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const [selectedLectures, setSelectedLectures] = useState({});
  const [bulkStatuses, setBulkStatuses] = useState({});

  const [pageError, setPageError] = useState("");

  // ==========================================
  // LIVE INDIA CLOCK
  // ==========================================

  useEffect(() => {
    const interval = setInterval(() => {
      setToday(getIndiaDate());
      setCurrentMinutes(getIndiaMinutes());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // LOAD SEMESTER
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

    const current = objectFrom(semesterRes, ["semester"]);

    const semesterData = current?.semester || current;

    if (!semesterData?._id) {
      throw new Error("No current semester found.");
    }

    setSemester(semesterData);

    return semesterData;
  }, []);

  // ==========================================
  // LOAD ALL ATTENDANCE DATA
  // ==========================================

  const loadData = useCallback(async (currentSemester, withLoader = true) => {
    if (!currentSemester?._id) return;

    if (withLoader) setLoading(true);

    try {
      const sid = idOf(currentSemester);

      const [timetableRes, attendanceRes, summaryRes] = await Promise.all([
        api.get(`/timetables/semester/${sid}`),
        api.get(`/attendance/semester/${sid}`),
        api.get(`/attendance/summary/${sid}`),
      ]);

      const timetableData = arrayFrom(timetableRes, [
        "timetable",
        "timetables",
        "records",
      ]);

      const attendanceData = arrayFrom(attendanceRes, [
        "records",
        "attendance",
        "attendances",
      ]);

      const summaryData = objectFrom(summaryRes, ["summary"]);

      setTimetable(timetableData);
      setRecords(attendanceData);
      setSummary(summaryData?.summary || summaryData);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Unable to load attendance details.",
      );
    } finally {
      if (withLoader) setLoading(false);
    }
  }, []);

  // ==========================================
  // INITIAL PAGE LOAD
  // ==========================================

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");

      const current = await loadSemester();

      await loadData(current, false);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Unable to load attendance.";

      setPageError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [loadSemester, loadData]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  // ==========================================
  // SEMESTER DATE STATE
  // ==========================================

  const semesterStart = semester?.startDate
    ? getSemesterDate(semester.startDate)
    : null;

  const semesterEnd = semester?.endDate
    ? getSemesterDate(semester.endDate)
    : null;

  const semesterState = useMemo(() => {
    if (!semester) return "missing";

    if (!semesterStart || !semesterEnd) return "invalid";

    if (today < semesterStart) return "upcoming";

    if (today > semesterEnd || semester.status === "completed") {
      return "completed";
    }

    if (semester.status !== "current") return "inactive";

    return "active";
  }, [semester, semesterStart, semesterEnd, today]);

  // ==========================================
  // SELECTED DATE LECTURES
  // ==========================================

  const lectures = useMemo(() => {
    return timetable
      .filter(
        (item) =>
          item.status === "active" &&
          item.entryType === "lecture" &&
          String(item.dayOfWeek).toLowerCase() === dayName(selectedDate),
      )
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  }, [timetable, selectedDate]);

  // ==========================================
  // FIND ATTENDANCE RECORD
  // ==========================================

  const recordFor = useCallback(
    (lecture) =>
      records.find(
        (record) =>
          String(idOf(record.timetable)) === String(idOf(lecture)) &&
          String(record.classDate).slice(0, 10) === selectedDate,
      ),
    [records, selectedDate],
  );

  // ==========================================
  // LECTURE WINDOW
  // ==========================================

  const getLectureWindow = useCallback(
    (lecture) => {
      const start = timeToMinutes(lecture.startTime);
      const end = timeToMinutes(lecture.endTime);

      if (start === null || end === null || end <= start) {
        return {
          open: false,
          reason: "Invalid lecture timing",
        };
      }

      if (selectedDate > today) {
        return {
          open: false,
          reason: "Future date attendance cannot be marked",
        };
      }

      if (selectedDate < semesterStart || selectedDate > semesterEnd) {
        return {
          open: false,
          reason: "Date is outside the semester timeline",
        };
      }

      if (semesterState !== "active") {
        return {
          open: false,
          reason: "Semester is not active",
        };
      }

      // Previous lecture dates can be marked at any time.
      if (selectedDate < today) {
        return {
          open: true,
          reason: "Past lecture attendance available",
        };
      }

      const openTime = Math.max(start, end - 10);

      if (currentMinutes < openTime) {
        return {
          open: false,
          reason: `Attendance opens at ${formatMinutes(openTime)}`,
        };
      }

      return {
        open: true,
        reason: "Attendance is open",
      };
    },
    [
      selectedDate,
      today,
      currentMinutes,
      semesterState,
      semesterStart,
      semesterEnd,
    ],
  );

  // ==========================================
  // SELECTED DAY COUNTS
  // ==========================================

  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let off = 0;

    lectures.forEach((lecture) => {
      const status = recordFor(lecture)?.status;

      if (status === "present") present++;
      else if (status === "absent") absent++;
      else if (status === "lecture_off") off++;
    });

    const marked = present + absent + off;

    return {
      total: lectures.length,
      present,
      absent,
      off,
      pending: Math.max(lectures.length - marked, 0),
      marked,
    };
  }, [lectures, recordFor]);

  // ==========================================
  // OVERALL SEMESTER COUNTS
  // ==========================================

  const overallCounts = useMemo(() => {
    const present = Number(summary?.present || 0);
    const absent = Number(summary?.absent || 0);
    const off = Number(summary?.lectureOff || 0);

    const total = countScheduledLectures(timetable, semesterStart, semesterEnd);

    const conducted = present + absent;

    const marked = present + absent + off;

    return {
      total,
      present,
      absent,
      off,
      conducted,
      pending: Math.max(total - marked, 0),
      percentage: conducted
        ? Number(((present / conducted) * 100).toFixed(2))
        : 0,
    };
  }, [summary, timetable, semesterStart, semesterEnd]);

  // ==========================================
  // INDIVIDUAL ATTENDANCE
  // ==========================================

  const submitAttendance = async (lecture, status) => {
    const existing = recordFor(lecture);

    // Once submitted, attendance is final and cannot be changed.
    if (existing) {
      return toast.error(
        "Attendance is already submitted and cannot be changed.",
      );
    }

    if (!["present", "absent", "lecture_off"].includes(status)) {
      return toast.error("Invalid attendance status.");
    }

    const window = getLectureWindow(lecture);

    if (!window.open) {
      return toast.error(window.reason);
    }

    const timetableId = idOf(lecture);
    const statusLabel = styles[status]?.label || status;

    try {
      setSubmittingId(timetableId);

      // Create a record only once. Existing records are never updated.
      await api.post("/attendance", {
        semester: idOf(semester),
        timetableId,
        classDate: selectedDate,
        status,
      });

      toast.success(`${statusLabel} marked successfully.`);

      // Remove this lecture from bulk selection after a successful save.
      setSelectedLectures((previous) => {
        const updated = { ...previous };
        delete updated[String(timetableId)];
        return updated;
      });

      await loadData(semester, false);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Could not save attendance.",
      );
    } finally {
      setSubmittingId(null);
    }
  };

  // ==========================================
  // BULK SELECTION
  // ==========================================

  const toggleLectureSelection = (lecture) => {
    const tid = String(idOf(lecture));

    const window = getLectureWindow(lecture);

    if (!window.open || recordFor(lecture)) return;

    setSelectedLectures((previous) => {
      const updated = { ...previous };

      if (updated[tid]) {
        delete updated[tid];
      } else {
        updated[tid] = true;
      }

      return updated;
    });

    setBulkStatuses((previous) => ({
      ...previous,
      [tid]: previous[tid] || "present",
    }));
  };

  const selectAllAvailable = () => {
    const available = lectures.filter(
      (lecture) => !recordFor(lecture) && getLectureWindow(lecture).open,
    );

    if (!available.length) {
      return toast.error("No lectures are currently available.");
    }

    const allSelected = available.every(
      (lecture) => selectedLectures[String(idOf(lecture))],
    );

    if (allSelected) {
      setSelectedLectures({});
      setBulkStatuses({});
      return;
    }

    const selection = {};
    const statuses = {};

    available.forEach((lecture) => {
      const tid = String(idOf(lecture));

      selection[tid] = true;
      statuses[tid] = bulkStatuses[tid] || "present";
    });

    setSelectedLectures(selection);
    setBulkStatuses(statuses);
  };

  const updateBulkStatus = (timetableId, status) => {
    setBulkStatuses((previous) => ({
      ...previous,
      [timetableId]: status,
    }));
  };

  // ==========================================
  // SUBMIT BULK ATTENDANCE
  // ==========================================

  const submitBulkAttendance = async () => {
    const entries = Object.keys(selectedLectures)
      .filter((tid) => selectedLectures[tid])
      .map((timetableId) => ({
        timetableId,
        status: bulkStatuses[timetableId] || "present",
      }));

    if (!entries.length) {
      return toast.error("Please select at least one lecture.");
    }

    const selectedStillValid = entries.every((entry) => {
      const lecture = lectures.find(
        (item) => String(idOf(item)) === entry.timetableId,
      );

      return lecture && !recordFor(lecture) && getLectureWindow(lecture).open;
    });

    if (!selectedStillValid) {
      return toast.error(
        "One or more selected lectures are no longer available.",
      );
    }

    try {
      setBulkSubmitting(true);

      await api.post("/attendance/bulk", {
        semester: idOf(semester),
        classDate: selectedDate,
        entries,
      });

      toast.success(
        `${entries.length} lecture attendance records submitted successfully.`,
      );

      setSelectedLectures({});
      setBulkStatuses({});

      await loadData(semester, false);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Could not submit bulk attendance.",
      );
    } finally {
      setBulkSubmitting(false);
    }
  };

  // ==========================================
  // DATE NAVIGATION
  // ==========================================

  const moveDate = (amount) => {
    const date = new Date(`${selectedDate}T12:00:00.000Z`);

    date.setUTCDate(date.getUTCDate() + amount);

    const nextDate = date.toISOString().slice(0, 10);

    if (nextDate > today) return;
    if (semesterStart && nextDate < semesterStart) return;

    setSelectedDate(nextDate);
    setSelectedLectures({});
    setBulkStatuses({});
  };

  const refresh = async () => {
    if (!semester) return;

    setRefreshing(true);

    await loadData(semester, false);

    setRefreshing(false);
  };

  // ==========================================
  // BULK / COUNTS
  // ==========================================

  const selectedCount = Object.values(selectedLectures).filter(Boolean).length;

  const availableCount = lectures.filter(
    (lecture) => !recordFor(lecture) && getLectureWindow(lecture).open,
  ).length;

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-indigo-600" size={34} />
          <p className="mt-3 text-sm text-slate-500">Loading attendance...</p>
        </div>
      </main>
    );
  }

  // ==========================================
  // NO SEMESTER
  // ==========================================

  if (!semester) {
    return (
      <main className="mx-auto max-w-7xl py-12">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <AlertCircle size={36} className="mx-auto text-amber-500" />

          <h2 className="mt-4 text-xl font-semibold text-slate-900">
            Semester Not Available
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {pageError || "No current semester is linked to your account."}
          </p>

          <button
            onClick={loadPage}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // SEMESTER NOT STARTED / ENDED
  // ==========================================

  if (semesterState !== "active") {
    const upcoming = semesterState === "upcoming";

    const title = upcoming
      ? "Your Semester Has Not Started Yet"
      : semesterState === "completed"
        ? "Your Semester Has Ended"
        : "Semester Not Active";

    const description = upcoming
      ? `Your semester will start on ${semesterStart}.`
      : semesterState === "completed"
        ? `Your semester ended on ${semesterEnd}.`
        : "Your semester is not currently active.";

    return (
      <main className="mx-auto max-w-7xl py-12">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <CalendarDays size={42} className="mx-auto text-indigo-500" />

          <h2 className="mt-4 text-xl font-semibold text-slate-900">{title}</h2>

          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
      </main>
    );
  }

  // ==========================================
  // MAIN ATTENDANCE UI
  // ==========================================

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      {/* HEADER */}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Student Portal</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Attendance
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View your lectures and manage your attendance.
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {/* OVERALL ATTENDANCE */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Overall Semester Attendance
            </p>

            <h2 className="mt-1 text-3xl font-bold text-slate-900">
              {overallCounts.percentage.toFixed(1)}%
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Present ÷ (Present + Absent). Class Off excluded.
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <GraduationCap size={25} />
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{
              width: `${Math.min(Math.max(overallCounts.percentage, 0), 100)}%`,
            }}
          />
        </div>

        <p className="mt-2 text-xs text-slate-500">
          {overallCounts.present} Present out of {overallCounts.conducted}{" "}
          conducted lectures
        </p>
      </section>

      {/* OVERALL COUNTS */}

      <section>
        <div className="mb-3">
          <h2 className="font-semibold text-slate-900">
            Overall Lecture Summary
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Semester start se aaj tak ke scheduled lectures aur attendance
            records.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            label="Total Lectures"
            value={overallCounts.total}
            icon={BookOpen}
            color="indigo"
          />

          <StatCard
            label="Total Present"
            value={overallCounts.present}
            icon={CheckCircle2}
            color="emerald"
          />

          <StatCard
            label="Total Absent"
            value={overallCounts.absent}
            icon={XCircle}
            color="rose"
          />

          <StatCard
            label="Total Class Off"
            value={overallCounts.off}
            icon={Ban}
            color="orange"
          />

          <StatCard
            label="Total Pending"
            value={overallCounts.pending}
            icon={Clock3}
            color="amber"
          />
        </div>
      </section>

      {/* SELECTED DAY COUNTS */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-slate-900">Selected Day Summary</h2>

          <p className="mt-1 text-xs text-slate-500">
            {displayDate(selectedDate)} · {counts.total} scheduled lectures
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard
            label="Total"
            value={counts.total}
            icon={BookOpen}
            color="indigo"
          />

          <StatCard
            label="Present"
            value={counts.present}
            icon={CheckCircle2}
            color="emerald"
          />

          <StatCard
            label="Absent"
            value={counts.absent}
            icon={XCircle}
            color="rose"
          />

          <StatCard
            label="Class Off"
            value={counts.off}
            icon={Ban}
            color="orange"
          />

          <StatCard
            label="Pending"
            value={counts.pending}
            icon={Clock3}
            color="amber"
          />
        </div>
      </section>

      {/* DATE SELECTOR */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarDays size={21} />
            </div>

            <div>
              <p className="text-xs text-slate-500">Selected date</p>

              <h2 className="mt-0.5 font-semibold text-slate-900">
                {displayDate(selectedDate)}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => moveDate(-1)}
              disabled={selectedDate <= semesterStart}
              aria-label="Previous day"
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={19} />
            </button>

            <button
              onClick={() => {
                setSelectedDate(today);
                setSelectedLectures({});
                setBulkStatuses({});
              }}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Today
            </button>

            <button
              onClick={() => moveDate(1)}
              disabled={selectedDate >= today}
              aria-label="Next day"
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={19} />
            </button>

            <input
              type="date"
              value={selectedDate}
              max={today}
              min={semesterStart || undefined}
              onChange={(event) => {
                const value = event.target.value;

                if (!value) return;

                if (value > today) {
                  return toast.error("Future date is not allowed.");
                }

                if (value < semesterStart || value > semesterEnd) {
                  return toast.error(
                    "Please select a date within the semester.",
                  );
                }

                setSelectedDate(value);
                setSelectedLectures({});
                setBulkStatuses({});
              }}
              className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </section>

      {/* LECTURES HEADER */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {selectedDate === today ? "Today's Lectures" : "Lecture History"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {lectures.length} lecture(s) scheduled
          </p>
        </div>

        <p className="text-xs font-medium text-slate-500">
          {counts.marked} of {lectures.length} marked
        </p>
      </div>

      {/* BULK ACTIONS */}

      {availableCount > 0 && (
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">Bulk Attendance</p>

              <p className="mt-1 text-xs text-slate-600">
                Select unmarked lectures and assign Present, Absent or Class
                Off.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={selectAllAvailable}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
              >
                <CheckSquare size={16} />
                Select All Available
              </button>

              <button
                onClick={submitBulkAttendance}
                disabled={selectedCount === 0 || bulkSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bulkSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ClipboardCheck size={16} />
                )}
                Submit ({selectedCount})
              </button>
            </div>
          </div>
        </section>
      )}

      {/* NO LECTURES */}

      {!lectures.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <CalendarDays className="mx-auto text-slate-300" size={36} />

          <h3 className="mt-3 font-semibold text-slate-800">
            No Lectures Scheduled
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            There are no lectures in your timetable for this day.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lectures.map((lecture, index) => {
            const record = recordFor(lecture);

            const config = record ? styles[record.status] : null;

            const Icon = config?.Icon;

            const subject = lecture.subject || {};
            const tid = String(idOf(lecture));

            const busy = submittingId === tid;
            const window = getLectureWindow(lecture);
            const selected = Boolean(selectedLectures[tid]);

            return (
              <article
                key={tid}
                className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${
                  config
                    ? config.card
                    : selected
                      ? "border-indigo-300 bg-indigo-50/30"
                      : "border-slate-200"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    {/* BULK CHECKBOX */}

                    {!record && window.open && (
                      <button
                        onClick={() => toggleLectureSelection(lecture)}
                        aria-label={
                          selected ? "Deselect lecture" : "Select lecture"
                        }
                        className="mt-2 shrink-0 text-indigo-600"
                      >
                        {selected ? (
                          <CheckSquare size={21} />
                        ) : (
                          <Square size={21} />
                        )}
                      </button>
                    )}

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <BookOpen size={21} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {subject.subjectName || "Subject"}
                        </h3>

                        {subject.subjectCode && (
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                            {subject.subjectCode}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={14} />
                          {displayTime(lecture.startTime)} –{" "}
                          {displayTime(lecture.endTime)}
                        </span>

                        <span>Lecture {index + 1}</span>

                        {subject.teacherName && (
                          <span>{subject.teacherName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* STATUS BADGE */}

                  {config ? (
                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${config.badge}`}
                    >
                      <Icon size={14} />
                      {config.label}
                    </span>
                  ) : (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                      <Clock3 size={14} />
                      Pending
                    </span>
                  )}
                </div>

                {/* CARD FOOTER */}

                <div className="mt-4 border-t border-slate-100 pt-4">
                  {record ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs leading-5 text-slate-600">
                        {record.status === "lecture_off"
                          ? "Class Off has been marked successfully."
                          : `Attendance marked as ${styles[record.status]?.label || record.status}.`}
                        {record.markedAt
                          ? ` · ${new Date(record.markedAt).toLocaleString("en-IN")}`
                          : ""}
                      </p>

                      <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                        <CheckCircle2 size={14} />
                        Submitted · Cannot be changed
                      </span>
                    </div>
                  ) : !window.open ? (
                    <p className="flex items-center gap-2 text-xs text-amber-700">
                      <Clock3 size={15} />
                      {window.reason}
                    </p>
                  ) : selected ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-medium text-indigo-700">
                        Select attendance status for this lecture
                      </p>

                      <div className="grid grid-cols-1 gap-2 sm:w-[390px] sm:grid-cols-3">
                        <button
                          onClick={() => updateBulkStatus(tid, "present")}
                          className={`rounded-xl border px-2 py-2 text-sm font-semibold ${
                            bulkStatuses[tid] === "present"
                              ? "border-emerald-500 bg-emerald-100 text-emerald-800"
                              : "border-emerald-200 bg-white text-emerald-700"
                          }`}
                        >
                          Present
                        </button>

                        <button
                          onClick={() => updateBulkStatus(tid, "absent")}
                          className={`rounded-xl border px-2 py-2 text-sm font-semibold ${
                            bulkStatuses[tid] === "absent"
                              ? "border-rose-500 bg-rose-100 text-rose-800"
                              : "border-rose-200 bg-white text-rose-700"
                          }`}
                        >
                          Absent
                        </button>

                        <button
                          onClick={() => updateBulkStatus(tid, "lecture_off")}
                          className={`rounded-xl border px-2 py-2 text-sm font-semibold ${
                            bulkStatuses[tid] === "lecture_off"
                              ? "border-orange-500 bg-orange-100 text-orange-800"
                              : "border-orange-200 bg-white text-orange-700"
                          }`}
                        >
                          Class Off
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <p className="mr-auto text-xs text-slate-500">
                        Attendance window is open
                      </p>

                      <div className="grid grid-cols-1 gap-2 sm:w-[390px] sm:grid-cols-3">
                        <button
                          onClick={() => submitAttendance(lecture, "present")}
                          disabled={busy}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 min-h-11 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busy ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          Present
                        </button>

                        <button
                          onClick={() => submitAttendance(lecture, "absent")}
                          disabled={busy}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 min-h-11 px-3 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busy ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <XCircle size={16} />
                          )}
                          Absent
                        </button>

                        <button
                          onClick={() =>
                            submitAttendance(lecture, "lecture_off")
                          }
                          disabled={busy}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 min-h-11 px-3 py-2.5 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busy ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Ban size={16} />
                          )}
                          Class Off
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* FOOTER NOTE */}

      <p className="text-center text-xs text-slate-400">
        Attendance opens during the final 10 minutes of today's lecture.
        Previous lecture dates remain available within the semester. All times
        are based on Indian Standard Time.
      </p>
    </main>
  );
}
