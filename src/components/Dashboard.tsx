import {
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import {
  getAnchoredPopupPosition,
  type AnchoredPopupPosition,
} from "../lib/anchoredPopup";
import {
  cacheProfile,
  getCachedProfile,
  cacheAnalytics,
  getCachedAnalytics,
} from "../lib/offlineCache";
import { AnimatedPresence } from "./AnimatedPresence";
import { AnchoredPopup } from "./AnchoredPopup";
import { LinkManager } from "./LinkManager";
import { QRCodeGenerator } from "./QRCodeGenerator";
import {
  LogOut,
  Lock,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Upload,
  Trash2,
  Eye,
  MousePointerClick,
  QrCode,
  ChevronDown,
  WifiOff,
} from "lucide-react";
import toast from "react-hot-toast";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
}

export function Dashboard() {
  const { user, signOut, resetPassword, changePassword } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deleteAvatarPopup, setDeleteAvatarPopup] =
    useState<AnchoredPopupPosition | null>(null);
  const [isDeleteAvatarPopupOpen, setIsDeleteAvatarPopupOpen] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showFullAvatar, setShowFullAvatar] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // ✅ Analytics
  const [totalViews, setTotalViews] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setDisplayName(data.display_name || "");
      setBio(data.bio || "");
      cacheProfile(data);
    } catch (err: Error | unknown) {
      // Offline fallback
      const cached = getCachedProfile<Profile>();
      if (cached) {
        setProfile(cached);
        setDisplayName(cached.display_name || "");
        setBio(cached.bio || "");
      } else {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error.message || "Error fetching profile");
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ Fetch Analytics
  const fetchAnalytics = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { count: viewsCount } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profile.id);

      const { count: clicksCount } = await supabase
        .from("link_clicks")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profile.id);

      const views = viewsCount || 0;
      const clicks = clicksCount || 0;
      setTotalViews(views);
      setTotalClicks(clicks);
      cacheAnalytics({ totalViews: views, totalClicks: clicks });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Offline fallback
      const cached = getCachedAnalytics();
      if (cached) {
        setTotalViews(cached.totalViews);
        setTotalClicks(cached.totalClicks);
      }
    }
  }, [profile?.id]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user, fetchProfile]);

  useEffect(() => {
    if (profile?.id) fetchAnalytics();
  }, [profile?.id, fetchAnalytics]);

  // Online / Offline detection
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!deleteAvatarPopup) return;

    const closePopup = () => setIsDeleteAvatarPopupOpen(false);
    window.addEventListener("resize", closePopup);
    window.addEventListener("scroll", closePopup, true);

    return () => {
      window.removeEventListener("resize", closePopup);
      window.removeEventListener("scroll", closePopup, true);
    };
  }, [deleteAvatarPopup]);

  const handleSaveProfile = async () => {
    if (!profile) return;

    if (!profile.username.trim()) {
      setError("Username cannot be empty");
      return;
    }

    if (profile.username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(profile.username)) {
      setError(
        "Username can only contain letters, numbers, underscores, and hyphens"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const toastId = toast.loading("Saving profile...");

      const { error } = await supabase
        .from("profiles")
        .update({
          username: profile.username.toLowerCase().trim(),
          display_name: displayName,
          bio: bio,
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast.success("Profile Updated Successfully ✅", { id: toastId });
      await fetchProfile();
    } catch (err: Error | unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message || "Error updating profile");
      toast.error(error.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const profileUrl = profile?.username
    ? `${window.location.origin}/${profile.username}`
    : "";

  const copyToClipboard = async () => {
    if (!profileUrl) return;

    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success("Link copied 📌");

    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewProfile = () => {
    if (!profileUrl) return;

    // push a new entry and notify listeners so navigation happens without a full reload
    window.history.pushState(null, "", profileUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file ❌");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB ❌");
        return;
      }

      if (!user?.id) return;

      setUploadingAvatar(true);
      const toastId = toast.loading("Uploading avatar...");

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const avatarUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Avatar updated successfully 🎉", { id: toastId });

      setProfile((prev) => (prev ? { ...prev, avatar_url: avatarUrl } : prev));
    } catch (err: Error | unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast.error(error.message || "Failed to upload avatar ❌");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = (button: HTMLButtonElement) => {
    if (!profile?.avatar_url) {
      toast.error("No avatar to delete ❌");
      return;
    }

    setDeleteAvatarPopup(
      getAnchoredPopupPosition(button.getBoundingClientRect(), 320, 170)
    );
    setIsDeleteAvatarPopupOpen(true);
  };

  const confirmDeleteAvatar = async () => {
    if (!profile?.avatar_url) return;

    try {
      setDeletingAvatar(true);
      const toastId = toast.loading("Deleting avatar...");

      const splitUrl = profile?.avatar_url?.split("/avatars/");

      if (!splitUrl || splitUrl.length < 2) {
        toast.error("Invalid avatar URL ❌", { id: toastId });
        return;
      }

      const filePath = splitUrl[1];

      const { error: deleteError } = await supabase.storage
        .from("avatars")
        .remove([filePath]);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: "" })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      setProfile((prev) => (prev ? { ...prev, avatar_url: "" } : prev));

      toast.success("Avatar deleted successfully 🗑️", { id: toastId });
      setIsDeleteAvatarPopupOpen(false);
    } catch (err: Error | unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast.error(error.message || "Failed to delete avatar ❌");
    } finally {
      setDeletingAvatar(false);
    }
  };

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  const handleOpenChangePasswordModal = () => {
    setShowDropdown(false);
    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowChangePasswordModal(true);
  };

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordError("");

      const toastId = toast.loading("Updating password...");
      const { error } = await changePassword(currentPassword, newPassword);

      if (error) {
        throw error;
      }

      toast.success("Password updated successfully.", { id: toastId });
      closeChangePasswordModal();
    } catch (err: Error | unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      setPasswordError(error.message || "Unable to update password");
      toast.error(error.message || "Unable to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) {
      toast.error("No email found for this account.");
      return;
    }

    try {
      setShowDropdown(false);
      setSendingResetEmail(true);

      const toastId = toast.loading("Sending password reset email...");
      const { error } = await resetPassword(user.email);

      if (error) {
        throw error;
      }

      toast.success(`Reset email sent to ${user.email}.`, { id: toastId });
    } catch (err: Error | unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast.error(error.message || "Unable to send reset email");
    } finally {
      setSendingResetEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-3xl flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/80 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Offline Banner */}
      {isOffline && (
        <div className="glass bg-amber-500/80 text-white text-center py-2 px-4 text-sm font-semibold flex items-center justify-center gap-2 animate-fadeIn">
          <WifiOff className="w-4 h-4" />
          You're offline — viewing cached data
        </div>
      )}
      <header className="glass sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-white">LinkNest | Dashboard</h1>
            <p className="text-xs text-white/50">
              Manage your profile & links easily ✨
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleViewProfile}
              className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl font-semibold glass-button"
            >
              <ExternalLink className="w-4 h-4" />
              View Public Profile
            </button>

            {/* Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown((prev) => !prev)}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl glass-light hover:bg-white/20 transition font-semibold text-white"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    onClick={() => setShowDropdown((prev) => !prev)}
                    className="w-8 h-8 rounded-full object-cover border-2 border-indigo-400 cursor-pointer hover:scale-110 transition-transform"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center border border-white/30">
                    <span className="text-sm font-bold text-white">
                      {profile?.display_name?.[0]?.toUpperCase() ||
                        profile?.username?.[0]?.toUpperCase() ||
                        "U"}
                    </span>
                  </div>
                )}
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${showDropdown ? "rotate-180" : ""}
                    `}
                />
              </button>

              <AnimatedPresence show={showDropdown} duration={220}>
                {(state) => (
                  <div
                    className={`absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl glass-dropdown ${
                      state === "enter"
                        ? "motion-menu-enter"
                        : "motion-menu-exit"
                    }`}
                  >
                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setShowQRModal(true);
                        }}
                        className="motion-menu-item group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 transition-all duration-200 hover:bg-white/10"
                        style={{ "--stagger-index": 0 } as CSSProperties}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/30 border border-purple-400/30">
                          <QrCode className="h-4 w-4 text-purple-300" />
                        </div>
                        Generate QR Code
                      </button>

                      <div className="mx-2 my-1 h-px bg-white/10" />

                      <button
                        onClick={handleOpenChangePasswordModal}
                        className="motion-menu-item group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 transition-all duration-200 hover:bg-white/10"
                        style={{ "--stagger-index": 1 } as CSSProperties}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/30 border border-pink-400/30">
                          <Lock className="h-4 w-4 text-pink-300" />
                        </div>
                        Change Password
                      </button>

                      <button
                        onClick={handleForgotPassword}
                        disabled={sendingResetEmail}
                        className="motion-menu-item group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 transition-all duration-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ "--stagger-index": 2 } as CSSProperties}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/30 border border-cyan-400/30">
                          <Mail className="h-4 w-4 text-cyan-300" />
                        </div>
                        {sendingResetEmail
                          ? "Sending Reset Email..."
                          : "Forgot Password"}
                      </button>

                      <div className="mx-2 my-1 h-px bg-white/10" />

                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          signOut();
                        }}
                        className="motion-menu-item group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 transition-all duration-200 hover:bg-red-500/20 hover:text-red-300"
                        style={{ "--stagger-index": 3 } as CSSProperties}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                          <LogOut className="h-4 w-4 text-white/60" />
                        </div>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </AnimatedPresence>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-1 glass-card p-6 rounded-3xl animate-slideInFromLeft">
          <h2 className="text-lg font-bold text-white mb-5">
            Profile Settings
          </h2>

          {/* ✅ Analytics Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="glass p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                <Eye className="w-4 h-4" />
                Views
              </div>
              <p className="text-2xl font-extrabold text-white mt-2">
                {totalViews}
              </p>
            </div>

            <div className="glass p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-violet-300 font-bold">
                <MousePointerClick className="w-4 h-4" />
                Clicks
              </div>
              <p className="text-2xl font-extrabold text-white mt-2">
                {totalClicks}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 glass border-red-500/30 rounded-xl text-red-300 text-sm animate-fadeIn">
              {error}
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div 
              onClick={() => profile?.avatar_url && setShowFullAvatar(true)}
              className={`w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-400/50 shadow-lg bg-indigo-500/20 flex items-center justify-center ${profile?.avatar_url ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-extrabold text-indigo-300">
                  {profile?.display_name?.[0]?.toUpperCase() ||
                    profile?.username?.[0]?.toUpperCase() ||
                    "U"}
                </span>
              )}
            </div>

            <label className="mt-4 cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 glass-button text-white rounded-xl font-semibold">
              <Upload className="w-4 h-4" />
              {uploadingAvatar ? "Uploading..." : "Upload Avatar"}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </label>

            <p className="text-xs text-white/40 mt-2">
              JPG/PNG only. Max 2MB.
            </p>

            {profile?.avatar_url && (
              <button
                onClick={(e) => handleDeleteAvatar(e.currentTarget)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition"
              >
                <Trash2 className="w-4 h-4" />
                Delete Avatar
              </button>
            )}
          </div>

          {deleteAvatarPopup && (
            <AnchoredPopup
              open={isDeleteAvatarPopupOpen}
              position={deleteAvatarPopup}
              onDismiss={() => setIsDeleteAvatarPopupOpen(false)}
              onExited={() => setDeleteAvatarPopup(null)}
              dismissDisabled={deletingAvatar}
              popupClassName="w-80 rounded-2xl glass-modal p-5"
            >
              <h3 className="mb-3 text-lg font-bold text-white">
                Delete Avatar
              </h3>
              <p className="mb-5 text-sm text-white/60">
                Remove your profile photo? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteAvatarPopupOpen(false)}
                  disabled={deletingAvatar}
                  className="px-5 py-2.5 glass rounded-xl font-semibold text-white/80 disabled:opacity-60 hover:bg-white/10 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDeleteAvatar}
                  disabled={deletingAvatar}
                  className="px-5 py-2.5 bg-red-500/60 backdrop-blur-sm rounded-xl font-semibold text-white border border-red-400/30 disabled:opacity-60 hover:bg-red-500/70 transition"
                >
                  {deletingAvatar ? "Deleting..." : "Delete"}
                </button>
              </div>
            </AnchoredPopup>
          )}

          {/* Username */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-white/80 mb-2">
              Username
            </label>

            <input
              type="text"
              value={profile?.username || ""}
              onChange={(e) =>
                setProfile((prev) =>
                  prev
                    ? { ...prev, username: e.target.value.toLowerCase() }
                    : prev
                )
              }
              className="w-full px-4 py-3.5 glass-input rounded-xl outline-none transition-all text-white placeholder-white/40"
              placeholder="username"
            />

            <p className="text-xs text-white/40 mt-2">
              Only letters, numbers, _ and - allowed.
            </p>
          </div>

          {/* Display Name */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-white/80 mb-2">
              Display Name
            </label>

            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3.5 glass-input rounded-xl outline-none transition-all text-white placeholder-white/40"
              placeholder="Your name"
            />
          </div>

          {/* Bio */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-white/80 mb-2">
              Bio
            </label>

            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3.5 glass-input rounded-xl outline-none transition-all text-white placeholder-white/40 resize-none"
              placeholder="Write something about you..."
              rows={3}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full py-3.5 rounded-xl font-semibold glass-button text-white shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>

          {/* Profile URL */}
          {profileUrl && (
            <div className="mt-6">
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Your Profile Link
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={profileUrl}
                  readOnly
                  className="flex-1 px-4 py-3 glass-input rounded-xl text-white/70 text-sm"
                />

                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 glass rounded-xl hover:bg-white/20 transition"
                  title="Copy Link"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-white/70" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2">
          {user?.id && <LinkManager userId={user.id} />}
        </div>
      </main>

      {/* Full Screen Avatar Modal */}
      {showFullAvatar && profile?.avatar_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4"
          onClick={() => setShowFullAvatar(false)}
        >
          <div 
            className="relative max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={profile.avatar_url}
              alt="Full size avatar"
              onClick={() => setIsZoomed(!isZoomed)}
              className={`w-full rounded-2xl shadow-2xl object-contain cursor-zoom-in transition-transform duration-300 ${isZoomed ? 'scale-150' : ''}`}
              style={{ maxHeight: isZoomed ? '90vh' : '70vh' }}
            />
            <button
              onClick={() => setShowFullAvatar(false)}
              className="absolute -top-2 -right-2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="text-white/50 text-center text-sm mt-2">
              {isZoomed ? 'Click to zoom out' : 'Click to zoom in'}
            </p>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && profileUrl && (
        <QRCodeGenerator
          profileUrl={profileUrl}
          avatarUrl={profile?.avatar_url || undefined}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {showChangePasswordModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeChangePasswordModal}
          />

          <div className="relative glass-modal rounded-2xl p-6 max-w-md w-full z-10 animate-zoomIn">
            <h3 className="text-xl font-bold text-white mb-2">
              Change Password
            </h3>
            <p className="text-sm text-white/60 mb-4">
              Update the password for {user?.email || "your account"}.
            </p>
            <p className="text-xs text-white/40 mb-6">
              If you do not remember your current password, use the forgot
              password option in the account menu.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3.5 glass-input rounded-xl outline-none transition-all text-white placeholder-white/40"
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3.5 glass-input rounded-xl outline-none transition-all text-white placeholder-white/40"
                  placeholder="Enter a new password"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3.5 glass-input rounded-xl outline-none transition-all text-white placeholder-white/40"
                  placeholder="Confirm your new password"
                  minLength={6}
                  required
                />
              </div>

              {passwordError && (
                <div className="p-3 glass border-red-500/30 rounded-xl text-red-300 text-sm">
                  {passwordError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeChangePasswordModal}
                  className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 via-indigo-500 to-teal-500 text-white font-semibold disabled:opacity-60"
                >
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
