
import {
  GraduationCap,
  BookOpen,
  CalendarDays,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const AcademicProgramStep = ({
  formData,
  setFormData,
  onBack,
  onNext,
}) => {
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.programName.trim()) return;
    if (!formData.degree.trim()) return;
    if (!formData.course.trim()) return;
    if (!formData.batchStartYear || !formData.batchEndYear) return;
    if (Number(formData.batchEndYear) < Number(formData.batchStartYear)) return;
    if (!formData.totalSemesters) return;

    onNext();
  };

  return (
    <div>
      <div className="mb-7">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <GraduationCap size={24} />
        </div>

        <h3 className="text-xl font-bold text-slate-900">
          Academic Program Details
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Enter your degree and academic course information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Program Name *
          </label>

          <input
            type="text"
            name="programName"
            value={formData.programName}
            onChange={handleChange}
            placeholder="e.g. Bachelor of Technology"
            className={inputClass}
            required
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Degree *
            </label>

            <select
              name="degree"
              value={formData.degree}
              onChange={handleChange}
              className={inputClass}
              required
            >
              <option value="">Select degree</option>
              <option value="Diploma">Diploma</option>
              <option value="Bachelor">Bachelor</option>
              <option value="Master">Master</option>
              <option value="Doctorate">Doctorate</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Course *
            </label>

            <input
              type="text"
              name="course"
              value={formData.course}
              onChange={handleChange}
              placeholder="e.g. Computer Science"
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Department
            </label>

            <input
              type="text"
              name="programDepartment"
              value={formData.programDepartment}
              onChange={handleChange}
              placeholder="e.g. Computer Science & Engineering"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Specialization
            </label>

            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              placeholder="e.g. Artificial Intelligence"
              className={inputClass}
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-indigo-600" />

            <h4 className="text-sm font-bold text-slate-800">
              Academic Batch
            </h4>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Batch Start Year *
              </label>

              <input
                type="number"
                name="batchStartYear"
                value={formData.batchStartYear}
                onChange={handleChange}
                placeholder="e.g. 2022"
                min="1900"
                max="2100"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Batch End Year *
              </label>

              <input
                type="number"
                name="batchEndYear"
                value={formData.batchEndYear}
                onChange={handleChange}
                placeholder="e.g. 2026"
                min="1900"
                max="2100"
                className={inputClass}
                required
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-600" />

            <h4 className="text-sm font-bold text-slate-800">
              Program Structure
            </h4>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Total Semesters *
              </label>

              <select
                name="totalSemesters"
                value={formData.totalSemesters}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">Select total semesters</option>
                {[2, 4, 6, 8, 10, 12].map((number) => (
                  <option key={number} value={number}>
                    {number} Semesters
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Attendance Target
              </label>

              <div className="relative">
                <input
                  type="number"
                  name="attendanceTarget"
                  value={formData.attendanceTarget}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className={inputClass}
                />

                <span className="absolute right-4 top-3 text-sm text-slate-400">
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

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

export default AcademicProgramStep;
