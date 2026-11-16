import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserRound, Mail, ArrowRight, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import PasswordInput from "../../components/auth/PasswordInput";
import api from "../../services/api";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle input changes
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

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must contain at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!acceptedTerms) {
      newErrors.terms = "Please accept the Terms and Conditions";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Handle signup submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading || !validateForm()) return;

    setIsLoading(true);

    try {
      const signupData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        acceptedTerms,
      };

      const response = await api.post("/auth/register", signupData);

      toast.success(response.data.message || "Account created successfully!");

      navigate("/login", { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join SmartAttend and start managing your academic attendance."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <AuthInput
          label="Full Name"
          name="name"
          placeholder="Enter your full name"
          icon={UserRound}
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          autoComplete="name"
        />

        {/* Email Address */}
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

        {/* Account Type - Student Only */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Account Type
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-indigo-600 bg-indigo-50 p-4 ring-2 ring-indigo-100">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
              <GraduationCap size={24} className="text-indigo-600" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                Student Account
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                For college and university students
              </p>
            </div>

            <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
              <span className="text-xs font-bold text-white">✓</span>
            </div>
          </div>
        </div>

        {/* Password */}
        <PasswordInput
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
        />

        {/* Confirm Password */}
        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        {/* Terms & Conditions */}
        <div>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);

                if (e.target.checked) {
                  setErrors((prev) => ({
                    ...prev,
                    terms: "",
                  }));
                }
              }}
              className="mt-1 h-4 w-4 shrink-0 accent-indigo-600"
            />

            <span>
              I agree to the{" "}
              <Link
                to="/terms"
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {errors.terms && (
            <p className="mt-1.5 text-xs font-medium text-red-500">
              {errors.terms}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Creating Account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </form>

      {/* Login Link */}
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-bold text-indigo-600 transition hover:text-indigo-700"
        >
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Signup;
