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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fadeIn">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 via-violet-500 to-teal-500 rounded-3xl mb-5 shadow-lg glow-indigo">
            <Link2 className="w-10 h-10 text-white" />
          </div>

          <h1
            className="text-4xl font-extrabold text-white tracking-tight mb-2 animate-fadeInUp"
            style={{ animationDelay: "0.2s" }}
          >
            {title}
          </h1>
          <p
            className="text-white/60 text-sm animate-fadeInUp"
            style={{ animationDelay: "0.3s" }}
          >
            {subtitle}
          </p>
        </div>

        <div
          className="glass-card rounded-3xl p-8 animate-slideInUp"
          style={{ animationDelay: "0.4s" }}
        >
          {!isResetView && (
            <div className="flex gap-2 mb-6 glass rounded-xl p-1">
              <button
                type="button"
                onClick={() => switchAuthView("signin")}
                className={`flex-1 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                  isSignInView
                    ? "glass-button shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => switchAuthView("signup")}
                className={`flex-1 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                  isSignUpView
                    ? "glass-button shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/10"
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
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Username
                </label>

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3.5 glass-input rounded-xl outline-none transition-all text-white placeholder-white/40"
                  placeholder="johndoe"
                  required={isSignUpView}
                />
              </div>
            )}

            {!isResetView && (
              <div className="animate-fadeInUp">
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 glass-input rounded-xl outline-none transition-all text-white placeholder-white/40"
                  placeholder="you@example.com"
                  required
                />
              </div>
            )}

            {!isForgotView && (
              <div className="animate-fadeInUp">
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  {isResetView ? "New Password" : "Password"}
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 glass-input rounded-xl outline-none transition-all pr-12 text-white placeholder-white/40"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
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
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Confirm Password
                </label>

                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3.5 glass-input rounded-xl outline-none transition-all pr-12 text-white placeholder-white/40"
                    placeholder="Confirm your new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
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
              <div className="p-3 glass border-red-500/30 rounded-xl text-red-300 text-sm animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold glass-button text-white shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed animate-fadeInUp"
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
            <div className="mt-6 text-center text-sm">
              {isSignInView ? (
                <button
                  type="button"
                  onClick={() => switchAuthView("forgot")}
                  className="font-semibold text-purple-400 hover:text-purple-300 transition"
                >
                  Forgot password?
                </button>
              ) : isForgotView ? (
                <button
                  type="button"
                  onClick={() => switchAuthView("signin")}
                  className="font-semibold text-purple-400 hover:text-purple-300 transition"
                >
                  Back to sign in
                </button>
              ) : null}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-white/40 mt-8">
          Built with love using Supabase + React by Harish Kumar
        </p>
      </div>
    </div>
  );
}
