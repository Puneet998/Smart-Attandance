import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LockKeyhole, ArrowLeft, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "../../components/auth/AuthLayout";
import PasswordInput from "../../components/auth/PasswordInput";
import api from "../../services/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

    if (!formData.password) {
      newErrors.password = "New password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading || !validateForm()) return;

    if (!token) {
      toast.error("Password reset token is missing");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      toast.success(response.data.message || "Password reset successfully!");

      setIsSuccess(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to reset password. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout
        title="Password Updated!"
        subtitle="Your SmartAttend account password has been changed successfully."
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={34} className="text-green-600" />
          </div>

          <p className="mt-5 text-sm text-slate-600">
            You can now sign in using your new password.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Go to Login
            <ArrowLeft size={18} className="rotate-180" />
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Choose a strong password to secure your SmartAttend account."
    >
      {!token ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm font-medium text-red-600">
            Invalid password reset link. Please request a new link.
          </p>

          <Link
            to="/forgot-password"
            className="mt-4 inline-block text-sm font-bold text-indigo-600 hover:text-indigo-700"
          >
            Request New Reset Link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordInput
            label="New Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
          />

          <PasswordInput
            label="Confirm New Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Updating Password...
              </>
            ) : (
              <>
                <LockKeyhole size={18} />
                Reset Password
              </>
            )}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-600">
        Remember your password?{" "}
        <Link
          to="/login"
          className="font-bold text-indigo-600 hover:text-indigo-700"
        >
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ResetPassword;
