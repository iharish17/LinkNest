import { type FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Link2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";

type AuthView = "signin" | "signup" | "forgot";

export function Auth() {
  const [authView, setAuthView] = useState<AuthView>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isPasswordRecovery, resetPassword, signIn, signUp, updatePassword } =
    useAuth();

  const isResetView = isPasswordRecovery;
  const isSignInView = !isResetView && authView === "signin";
  const isSignUpView = !isResetView && authView === "signup";
  const isForgotView = !isResetView && authView === "forgot";

  useEffect(() => {
    if (isPasswordRecovery) {
      setError("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isPasswordRecovery]);

  const resetFormState = () => {
    setError("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchAuthView = (nextView: AuthView) => {
    setAuthView(nextView);
    setError("");

    if (nextView !== "signup") {
      setUsername("");
    }

    if (nextView !== "forgot") {
      resetFormState();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isForgotView) {
        const toastId = toast.loading("Sending reset link...");
        const { error } = await resetPassword(email.trim());

        if (error) {
          throw error;
        }

        toast.success("Password reset email sent. Check your inbox.", {
          id: toastId,
        });
        switchAuthView("signin");
        return;
      }

      if (isResetView) {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        const toastId = toast.loading("Updating password...");
        const { error } = await updatePassword(password);

        if (error) {
          throw error;
        }

        toast.success("Password updated successfully.", { id: toastId });
        resetFormState();
        return;
      }

      if (isSignInView) {
        const toastId = toast.loading("Signing in...");
        const { error } = await signIn(email.trim(), password);

        if (error) {
          throw error;
        }

        toast.success("Login successful.", { id: toastId });
        return;
      }

      if (!username.trim()) {
        throw new Error("Username is required");
      }

      if (username.trim().length < 3) {
        throw new Error("Username must be at least 3 characters");
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
        throw new Error(
          "Username can only contain letters, numbers, underscores, and hyphens"
        );
      }

      const toastId = toast.loading("Creating your account...");
      const { error } = await signUp(email.trim(), password, username.trim());

      if (error) {
        throw error;
      }

      toast.success("Account created successfully.", { id: toastId });
      switchAuthView("signin");
      setUsername("");
      setEmail("");
      setPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const title = isResetView
    ? "Create a new password"
    : isForgotView
    ? "Reset your password"
    : "LinkNest";

  const subtitle = isResetView
    ? "Set a new password for your account to finish recovery."
    : isForgotView
    ? "Enter your account email and we will send you a reset link."
    : "Share all your links in one clean page";

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fadeIn">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-500 via-purple-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
            <Link2 className="w-8 h-8 text-white" />
          </div>

          <h1
            className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2 animate-fadeInUp"
            style={{ animationDelay: "0.2s" }}
          >
            {title}
          </h1>
          <p
            className="text-gray-600 text-sm animate-fadeInUp"
            style={{ animationDelay: "0.3s" }}
          >
            {subtitle}
          </p>
        </div>

        <div
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100/50 p-8 animate-slideInUp"
          style={{ animationDelay: "0.4s" }}
        >
          {!isResetView && (
            <div className="flex gap-2 mb-6 bg-gradient-to-r from-rose-100/50 to-cyan-100/50 rounded-xl p-1">
              <button
                type="button"
                onClick={() => switchAuthView("signin")}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  isSignInView
                    ? "bg-gradient-to-r from-rose-500 to-purple-500 text-white shadow-lg animate-scaleIn"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => switchAuthView("signup")}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  isSignUpView
                    ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg animate-scaleIn"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            key={
              isResetView ? "reset" : isForgotView ? "forgot-password" : authView
            }
          >
            {isSignUpView && (
              <div className="animate-fadeInUp">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Username
                </label>

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 outline-none transition-all bg-white/50"
                  placeholder="johndoe"
                  required={isSignUpView}
                />
              </div>
            )}

            {!isResetView && (
              <div className="animate-fadeInUp">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 outline-none transition-all bg-white/50"
                  placeholder="you@example.com"
                  required
                />
              </div>
            )}

            {!isForgotView && (
              <div className="animate-fadeInUp">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {isResetView ? "New Password" : "Password"}
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 outline-none transition-all pr-10 bg-white/50"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {isResetView && (
              <div className="animate-fadeInUp">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Confirm Password
                </label>

                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 outline-none transition-all pr-10 bg-white/50"
                    placeholder="Confirm your new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                    title={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed animate-fadeInUp hover:from-rose-600 hover:via-purple-600 hover:to-cyan-600"
            >
              {loading
                ? "Please wait..."
                : isResetView
                ? "Update Password"
                : isForgotView
                ? "Send Reset Link"
                : isSignInView
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          {!isResetView && (
            <div className="mt-5 text-center text-sm">
              {isSignInView ? (
                <button
                  type="button"
                  onClick={() => switchAuthView("forgot")}
                  className="font-semibold text-purple-600 hover:text-purple-700 transition"
                >
                  Forgot password?
                </button>
              ) : isForgotView ? (
                <button
                  type="button"
                  onClick={() => switchAuthView("signin")}
                  className="font-semibold text-purple-600 hover:text-purple-700 transition"
                >
                  Back to sign in
                </button>
              ) : null}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Built with love using Supabase + React by Harish Kumar
        </p>
      </div>
    </div>
  );
}
