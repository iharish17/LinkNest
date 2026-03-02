import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const toastId = toast.loading("Signing in...");
        const { error } = await signIn(email, password);

        if (error) throw error;

        toast.success("Login successful ✅", { id: toastId });
      } else {
        if (!username.trim()) {
          throw new Error("Username is required");
        }
        if (username.length < 3) {
          throw new Error("Username must be at least 3 characters");
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
          throw new Error(
            "Username can only contain letters, numbers, underscores, and hyphens"
          );
        }

        const toastId = toast.loading("Creating your account...");
        const { error } = await signUp(email, password, username);

        if (error) throw error;

        toast.success("Account created successfully 🎉", { id: toastId });

        setIsLogin(true);
        setUsername("");
        setEmail("");
        setPassword("");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fadeIn">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-500 via-purple-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
            <Link2 className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2 animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
            LinkNest
          </h1>
          <p className="text-gray-600 text-sm animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
            Share all your links in one clean page ✨
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100/50 p-8 animate-slideInUp" style={{ animationDelay: "0.4s" }}>
          <div className="flex gap-2 mb-6 bg-gradient-to-r from-rose-100/50 to-cyan-100/50 rounded-xl p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-300 ${
                isLogin
                  ? "bg-gradient-to-r from-rose-500 to-purple-500 text-white shadow-lg animate-scaleIn"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Sign In
            </button>

            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-300 ${
                !isLogin
                  ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg animate-scaleIn"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" key={isLogin ? "login" : "signup"}>
            {!isLogin && (
              <div className="animate-fadeInUp" key={`username-${isLogin}`}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Username
                </label>

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 outline-none transition-all bg-white/50"
                  placeholder="johndoe"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="animate-fadeInUp" key={`email-${isLogin}`}>
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

            <div className="animate-fadeInUp" key={`password-${isLogin}`}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 outline-none transition-all pr-10 bg-white/50"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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

            {error && (
              <div key={`error-${error}`} className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-shake">
                {error}
              </div>
            )}

            <button
              key={`submit-${isLogin}`}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed animate-fadeInUp hover:from-rose-600 hover:via-purple-600 hover:to-cyan-600"
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Built with ❤️ using Supabase + React by Harish Kumar
        </p>
      </div>
    </div>
  );
}
