import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import PasswordInput from "../../components/auth/PasswordInput";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

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

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading || !validateForm()) return;

    setLoading(true);

    try {
      const response = await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      toast.success("Welcome back! Login successful.");

      const isSetupCompleted =
        response?.user?.isSetupCompleted ?? response?.isSetupCompleted;

      navigate(isSetupCompleted ? "/dashboard" : "/setup", {
        replace: true,
      });
    } catch (error) {
      const message =
        error.response?.data?.message || "Unable to login. Please try again.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back!"
      subtitle="Sign in to continue managing your attendance."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          label="Email Address"
          name="email"
          type="email"
          placeholder="you@example.com"
          icon={Mail}
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />

        <div>
          <PasswordInput
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 accent-indigo-600"
              />
              Remember me
            </label>

            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing In...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </form>

      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">NEW HERE?</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <p className="text-center text-sm text-slate-600">
        Don't have an account?{" "}
        <Link
          to="/signup"
          className="font-bold text-indigo-600 hover:text-indigo-700"
        >
          Create Account
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
