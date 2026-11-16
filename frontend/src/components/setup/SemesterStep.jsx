import { useState } from "react";
import {
  CalendarDays,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Info,
} from "lucide-react";

const SemesterStep = ({ formData, setFormData, onBack, onNext }) => {
  const [errors, setErrors] = useState({});

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.semesterNumber) {
      newErrors.semesterNumber = "Semester number is required";
    }

    if (!formData.semesterName.trim()) {
      newErrors.semesterName = "Semester name is required";
    }

    if (!formData.academicYear.trim()) {
      newErrors.academicYear = "Academic year is required";
    }

    if (!formData.semesterStartDate) {
      newErrors.semesterStartDate = "Start date is required";
    }

    if (!formData.semesterEndDate) {
      newErrors.semesterEndDate = "End date is required";
    }

    if (
      formData.semesterStartDate &&
      formData.semesterEndDate &&
      formData.semesterEndDate <= formData.semesterStartDate
    ) {
      newErrors.semesterEndDate = "End date must be after start date";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    onNext();
  };

  return (
    <div>
      {/* Heading */}
      <div className="mb-7">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <CalendarDays size={24} />
        </div>

        <h3 className="text-xl font-bold text-slate-900">
          First Semester Details
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Configure your first semester according to your academic program.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Semester Number */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Semester Number *
          </label>

          <select
            name="semesterNumber"
            value={formData.semesterNumber}
            onChange={handleChange}
            className={inputClass}
            required
          >
            <option value="">Select semester</option>

            {Array.from(
              { length: Number(formData.totalSemesters) || 1 },
              (_, index) => index + 1,
            ).map((number) => (
              <option key={number} value={number}>
                Semester {number}
              </option>
            ))}
          </select>

          {errors.semesterNumber && (
            <p className="mt-1.5 text-xs text-red-500">
              {errors.semesterNumber}
            </p>
          )}
        </div>

        {/* Semester Name */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Semester Name *
          </label>

          <input
            type="text"
            name="semesterName"
            value={formData.semesterName}
            onChange={handleChange}
            placeholder="e.g. First Semester"
            className={inputClass}
            required
          />

          {errors.semesterName && (
            <p className="mt-1.5 text-xs text-red-500">{errors.semesterName}</p>
          )}
        </div>

        {/* Academic Year */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Academic Year *
          </label>

          <input
            type="text"
            name="academicYear"
            value={formData.academicYear}
            onChange={handleChange}
            placeholder="e.g. 2026-2027"
            className={inputClass}
            required
          />

          {errors.academicYear && (
            <p className="mt-1.5 text-xs text-red-500">{errors.academicYear}</p>
          )}
        </div>

        {/* Semester Dates */}
        <div className="border-t border-slate-100 pt-6">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-indigo-600" />

            <h4 className="text-sm font-bold text-slate-800">
              Semester Duration
            </h4>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Start Date *
              </label>

              <input
                type="date"
                name="semesterStartDate"
                value={formData.semesterStartDate}
                onChange={handleChange}
                className={inputClass}
                required
              />

              {errors.semesterStartDate && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.semesterStartDate}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                End Date *
              </label>

              <input
                type="date"
                name="semesterEndDate"
                value={formData.semesterEndDate}
                onChange={handleChange}
                min={formData.semesterStartDate || undefined}
                className={inputClass}
                required
              />

              {errors.semesterEndDate && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.semesterEndDate}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Target */}
        <div className="border-t border-slate-100 pt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Semester Attendance Target
          </label>

          <div className="relative">
            <input
              type="number"
              name="semesterAttendanceTarget"
              value={formData.semesterAttendanceTarget}
              onChange={handleChange}
              min="0"
              max="100"
              className={inputClass}
            />

            <span className="absolute right-4 top-3 text-sm text-slate-400">
              %
            </span>
          </div>

          <p className="mt-1.5 text-xs text-slate-400">
            Your target attendance percentage for this semester.
          </p>
        </div>

        {/* Status Information */}
        <div className="flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <Info size={19} className="mt-0.5 shrink-0 text-indigo-600" />

          <div>
            <p className="text-sm font-semibold text-indigo-900">
              Initial Semester Status
            </p>

            <p className="mt-1 text-xs leading-5 text-indigo-700">
              Your semester will initially be created as Upcoming. You can start
              it when your academic semester begins.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
          >
            Continue
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default SemesterStep;
