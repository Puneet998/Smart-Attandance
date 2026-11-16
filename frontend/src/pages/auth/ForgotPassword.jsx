import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import api from "../../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Email address is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        email: normalizedEmail,
      });

      toast.success(
        response.data.message || "Password reset request submitted!",
      );

      setIsSubmitted(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to process request. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isSubmitted ? "Check Your Email" : "Forgot Password?"}
      subtitle={
        isSubmitted
          ? "If an account exists with this email, a password reset link has been sent."
          : "Enter your registered email address to receive a password reset link."
      }
    >
      {isSubmitted ? (
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={34} className="text-green-600" />
          </div>

          <p className="mt-5 break-all text-sm font-semibold text-slate-700">
            {email}
          </p>

          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              setEmail("");
            }}
            className="mt-6 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Try another email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthInput
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            error={error}
            autoComplete="email"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Sending Request...
              </>
            ) : (
              <>
                Send Reset Link
                <Send size={17} />
              </>
            )}
          </button>
        </form>
      )}

      <Link
        to="/login"
        className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
      >
        <ArrowLeft size={16} />
        Back to Login
      </Link>
    </AuthLayout>
  );
};

export default ForgotPassword;
