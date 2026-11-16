const AuthInput = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  name,
  autoComplete,
}) => {
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
        {Icon && <Icon size={19} className="shrink-0 text-slate-400" />}

        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="h-12 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
};

export default AuthInput;
