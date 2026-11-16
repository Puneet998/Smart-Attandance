import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

const PasswordInput = ({
  label = "Password",
  value,
  onChange,
  error,
  name = "password",
  autoComplete = "current-password",
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <div
        className={`flex items-center gap-3 rounded-xl border bg-white px-4 transition-all
          ${
            error
              ? "border-red-400 ring-2 ring-red-100"
              : "border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10"
          }`}
      >
        <LockKeyhole size={19} className="shrink-0 text-slate-400" />

        <input
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="h-12 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="text-slate-400 transition hover:text-indigo-600"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
};

export default PasswordInput;
