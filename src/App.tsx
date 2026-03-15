import { useEffect, useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { Auth } from "./components/Auth";
import { Dashboard } from "./components/Dashboard";
import { PublicProfile } from "./components/PublicProfile";
import { Toaster } from "react-hot-toast";

function AppContent() {
  const { user, loading, isPasswordRecovery } = useAuth();
  const [currentView, setCurrentView] = useState<
    "auth" | "dashboard" | "profile"
  >("auth");
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const updateView = () => {
      const path = window.location.pathname;

      if (path === "/" || path === "") {
        setCurrentView(user && !isPasswordRecovery ? "dashboard" : "auth");
      } else {
        const usernameFromPath = path.substring(1);
        setUsername(usernameFromPath);
        setCurrentView("profile");
      }
    };

    updateView();
    window.addEventListener("popstate", updateView);
    return () => window.removeEventListener("popstate", updateView);
  }, [isPasswordRecovery, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-700 font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4500,
          style: {
            fontSize: "16px",
            padding: "14px 18px",
            borderRadius: "14px",
            minWidth: "300px",
            background: "#111827",
            color: "#fff",
            boxShadow: "0px 10px 30px rgba(0,0,0,0.2)",
          },
          success: {
            duration: 5000,
          },
          error: {
            duration: 6000,
          },
        }}
      />

      <div className="animate-fadeIn">
        {currentView === "profile" && username ? (
          <PublicProfile username={username} />
        ) : currentView === "dashboard" && user ? (
          <Dashboard />
        ) : (
          <Auth />
        )}
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
