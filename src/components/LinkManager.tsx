import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { supabase, Link } from "../lib/supabase";
import {
  getAnchoredPopupPosition,
  type AnchoredPopupPosition,
} from "../lib/anchoredPopup";
import { cacheLinks, getCachedLinks } from "../lib/offlineCache";
import { AnchoredPopup } from "./AnchoredPopup";
import { AnimatedPresence } from "./AnimatedPresence";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { FaXTwitter } from "react-icons/fa6";
import {
  FaGithub,
  FaLinkedin,
  FaInstagram,
  FaYoutube,
  FaFacebook,
  FaSnapchatGhost,
  FaDiscord,
  FaTelegram,
  FaWhatsapp,
  FaGlobe,
  FaPinterest,
  FaTiktok,
  FaReddit,
  FaMedium,
  FaStackOverflow,
  FaGoogleDrive,
} from "react-icons/fa";

type LinkManagerProps = {
  userId: string;
};

type PopularLink = {
  name: string;
  url: string;
  platform: string;
  icon: JSX.Element;
};

type DeleteLinkPopup = {
  link: Link;
  position: AnchoredPopupPosition;
};

const popularLinks: PopularLink[] = [
  {
    name: "GitHub",
    url: "https://github.com/",
    platform: "github",
    icon: <FaGithub className="text-black w-5 h-5" />,
  },
  {
    name: "LinkedIn",
    url: "https://linkedin.com/in/",
    platform: "linkedin",
    icon: <FaLinkedin className="text-blue-600 w-5 h-5" />,
  },
  {
    name: "Instagram",
    url: "https://instagram.com/",
    platform: "instagram",
    icon: <FaInstagram className="text-pink-600 w-5 h-5" />,
  },
  {
    name: "YouTube",
    url: "https://youtube.com/",
    platform: "youtube",
    icon: <FaYoutube className="text-red-600 w-5 h-5" />,
  },
  {
    name: "Facebook",
    url: "https://facebook.com/",
    platform: "facebook",
    icon: <FaFacebook className="text-blue-700 w-5 h-5" />,
  },
  {
    name: "Twitter / X",
    url: "https://twitter.com/",
    platform: "twitter",
    icon: <FaXTwitter className="text-black w-5 h-5" />,
  },
  {
    name: "TikTok",
    url: "https://tiktok.com/@",
    platform: "tiktok",
    icon: <FaTiktok className="text-black w-5 h-5" />,
  },
  {
    name: "Pinterest",
    url: "https://pinterest.com/",
    platform: "pinterest",
    icon: <FaPinterest className="text-red-500 w-5 h-5" />,
  },
  {
    name: "Reddit",
    url: "https://reddit.com/user/",
    platform: "reddit",
    icon: <FaReddit className="text-orange-600 w-5 h-5" />,
  },
  {
    name: "Snapchat",
    url: "https://snapchat.com/add/",
    platform: "snapchat",
    icon: <FaSnapchatGhost className="text-yellow-400 w-5 h-5" />,
  },
  {
    name: "Discord",
    url: "https://discord.gg/",
    platform: "discord",
    icon: <FaDiscord className="text-purple-600 w-5 h-5" />,
  },
  {
    name: "Telegram",
    url: "https://t.me/",
    platform: "telegram",
    icon: <FaTelegram className="text-sky-600 w-5 h-5" />,
  },
  {
    name: "WhatsApp",
    url: "https://wa.me/",
    platform: "whatsapp",
    icon: <FaWhatsapp className="text-green-600 w-5 h-5" />,
  },
  {
    name: "Medium",
    url: "https://medium.com/@",
    platform: "medium",
    icon: <FaMedium className="text-black w-5 h-5" />,
  },
  {
    name: "Stack Overflow",
    url: "https://stackoverflow.com/users/",
    platform: "stackoverflow",
    icon: <FaStackOverflow className="text-orange-500 w-5 h-5" />,
  },
  {
    name: "Google Drive",
    url: "https://drive.google.com/",
    platform: "googledrive",
    icon: <FaGoogleDrive className="text-green-600 w-5 h-5" />,
  },
  {
    name: "Portfolio Website",
    url: "https://",
    platform: "portfolio",
    icon: <FaGlobe className="text-green-600 w-5 h-5" />,
  },
];

export function LinkManager({ userId }: LinkManagerProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPopularModal, setShowPopularModal] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<DeleteLinkPopup | null>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [formData, setFormData] = useState({
    title: "",
    url: "",
    platform: "custom",
  });

  const loadLinks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", userId)
        .order("position", { ascending: true });

      if (error) throw error;

      setLinks(data || []);
      cacheLinks(data || []);
    } catch (error) {
      console.error("Error loading links:", error);
      // Offline fallback
      const cached = getCachedLinks<Link>();
      if (cached) {
        setLinks(cached);
      } else {
        toast.error("Failed to load links ❌");
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

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

  useEffect(() => {
    if (!linkToDelete) return;

    const closePopup = () => setIsDeletePopupOpen(false);
    window.addEventListener("resize", closePopup);
    window.addEventListener("scroll", closePopup, true);

    return () => {
      window.removeEventListener("resize", closePopup);
      window.removeEventListener("scroll", closePopup, true);
    };
  }, [linkToDelete]);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();

    let url = formData.url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    try {
      const toastId = toast.loading("Adding link...");

      const maxPosition =
        links.length > 0 ? Math.max(...links.map((l) => l.position)) : -1;

      const { error } = await supabase.from("links").insert({
        user_id: userId,
        title: formData.title,
        url: url,
        platform: formData.platform,
        position: maxPosition + 1,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Link added ✅", { id: toastId });

      setFormData({ title: "", url: "", platform: "custom" });
      setShowAddForm(false);
      await loadLinks();
    } catch (error) {
      console.error("Error adding link:", error);
      toast.error("Failed to add link ❌");
    }
  };

  const handleUpdateLink = async (id: string, updates: Partial<Link>) => {
    try {
      const toastId = toast.loading("Updating link...");

      const { error } = await supabase.from("links").update(updates).eq("id", id);

      if (error) throw error;

      toast.success("Link updated ✅", { id: toastId });
      await loadLinks();
    } catch (error) {
      console.error("Error updating link:", error);
      toast.error("Failed to update link ❌");
    }
  };

  const handleDeleteRequest = (link: Link, button: HTMLButtonElement) => {
    setLinkToDelete({
      link,
      position: getAnchoredPopupPosition(button.getBoundingClientRect()),
    });
    setIsDeletePopupOpen(true);
  };

  const confirmDeleteLink = async () => {
    if (!linkToDelete) return;

    try {
      setDeletingLinkId(linkToDelete.link.id);
      const toastId = toast.loading("Deleting link...");

      const { error } = await supabase
        .from("links")
        .delete()
        .eq("id", linkToDelete.link.id);

      if (error) throw error;

      toast.success("Link deleted 🗑️", { id: toastId });
      setIsDeletePopupOpen(false);
      await loadLinks();
    } catch (error) {
      console.error("Error deleting link:", error);
      toast.error("Failed to delete link ❌");
    } finally {
      setDeletingLinkId(null);
    }
  };

  const handleToggleActive = async (link: Link) => {
    await handleUpdateLink(link.id, { is_active: !link.is_active });
  };

  const moveLink = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === links.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newLinks = [...links];
    const temp = newLinks[index];
    newLinks[index] = newLinks[newIndex];
    newLinks[newIndex] = temp;

    try {
      for (let i = 0; i < newLinks.length; i++) {
        await supabase
          .from("links")
          .update({ position: i })
          .eq("id", newLinks[i].id);
      }

      await loadLinks();
    } catch (error) {
      console.error("Error reordering links:", error);
      toast.error("Failed to reorder ❌");
    }
  };

  const handleSelectPopular = (link: PopularLink) => {
    setFormData({
      title: link.name,
      url: link.url,
      platform: link.platform,
    });

    setShowPopularModal(false);
    setShowAddForm(true);

    toast.success(`${link.name} selected ✅`);
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-lg p-6">
        <p className="text-gray-600 font-medium">Loading links...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200 p-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Your Links</h2>
          <p className="text-xs text-gray-500">
            Add, edit, reorder and hide your links
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowPopularModal(true)}
            disabled={isOffline}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow hover:from-purple-600 hover:to-cyan-600 transition-all font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            Popular Links
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={isOffline}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-500 text-white shadow hover:from-rose-600 hover:to-purple-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Plus className="w-4 h-4" />
            Add Link
          </button>
        </div>
      </div>

      {/* Popular Links Modal */}
      <AnimatedPresence show={showPopularModal} duration={280}>
        {(state) => (
          <div className="fixed inset-0 z-[110] flex items-end justify-center px-4 pb-4 pt-10 sm:items-center">
            <div
              className={`absolute inset-0 bg-slate-950/28 backdrop-blur-[2px] ${
                state === "enter"
                  ? "motion-overlay-enter"
                  : "motion-overlay-exit"
              }`}
              onClick={() => setShowPopularModal(false)}
            />

            <div
              className={`relative max-h-[78vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-gray-200 bg-white px-5 pb-6 pt-5 shadow-2xl sm:rounded-3xl sm:p-6 ${
                state === "enter"
                  ? "motion-attachments-enter"
                  : "motion-attachments-exit"
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-extrabold text-gray-900">
                  Popular Links
                </h3>

                <button
                  onClick={() => setShowPopularModal(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {popularLinks.map((link, index) => (
                  <button
                    key={link.name}
                    onClick={() => handleSelectPopular(link)}
                    className="motion-attachment-item flex items-center gap-3 rounded-2xl border border-gray-200 p-3 font-semibold text-gray-800 transition hover:border-purple-400 hover:bg-rose-50"
                    style={
                      {
                        "--stagger-index": index,
                      } as CSSProperties
                    }
                  >
                    <div className="p-2 rounded-xl bg-gray-100">{link.icon}</div>
                    <span className="text-sm">{link.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatedPresence>

      {/* Add Link Form */}
      <AnimatedPresence show={showAddForm} duration={240}>
        {(state) => (
          <form
            onSubmit={handleAddLink}
            className={`mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-5 ${
              state === "enter"
                ? "motion-inline-enter"
                : "motion-inline-exit"
            }`}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-purple-200 bg-white/50 px-4 py-3 outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-300"
                  placeholder="My Website"
                  required
                />
              </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="w-full rounded-xl border border-purple-200 bg-white/50 px-4 py-3 outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-300"
                placeholder="example.com"
                required
              />
            </div>

            {/* ✅ Platform Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) =>
                  setFormData({ ...formData, platform: e.target.value })
                }
                className="w-full rounded-xl border border-purple-200 bg-white/50 px-4 py-3 outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-300"
              >
                <option value="custom">Custom</option>
                <option value="github">GitHub</option>
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
                <option value="twitter">Twitter / X</option>
                <option value="tiktok">TikTok</option>
                <option value="pinterest">Pinterest</option>
                <option value="reddit">Reddit</option>
                <option value="snapchat">Snapchat</option>
                <option value="discord">Discord</option>
                <option value="telegram">Telegram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="medium">Medium</option>
                <option value="stackoverflow">Stack Overflow</option>
                <option value="googledrive">Google Drive</option>
                <option value="portfolio">Portfolio</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-rose-500 py-3 font-semibold text-white transition hover:bg-rose-600"
              >
                Add Link
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ title: "", url: "", platform: "custom" });
                }}
                className="rounded-xl bg-gray-200 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
            </div>
          </form>
        )}
      </AnimatedPresence>

      {links.length === 0 ? (
        <div className="text-center py-14 text-gray-500">
          <p className="font-medium">
            No links yet. Click "Add Link" to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link, index) => (
            <LinkItem
              key={link.id}
              link={link}
              index={index}
              totalLinks={links.length}
              editingId={editingId}
              isOffline={isOffline}
              onEdit={setEditingId}
              onUpdate={handleUpdateLink}
              onDelete={handleDeleteRequest}
              onToggleActive={handleToggleActive}
              onMove={moveLink}
            />
          ))}
        </div>
      )}

      {linkToDelete && (
        <AnchoredPopup
          open={isDeletePopupOpen}
          position={linkToDelete.position}
          onDismiss={() => setIsDeletePopupOpen(false)}
          onExited={() => setLinkToDelete(null)}
          dismissDisabled={!!deletingLinkId}
          popupClassName="w-80 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl"
        >
          <h3 className="mb-2 text-lg font-bold text-gray-900">Delete Link</h3>
          <p className="mb-1 text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">
              {linkToDelete.link.title}'s
            </span>{" "}
            link from your profile?
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeletePopupOpen(false)}
              disabled={!!deletingLinkId}
              className="rounded-xl bg-gray-200 px-4 py-2 font-semibold text-gray-800 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              onClick={confirmDeleteLink}
              disabled={!!deletingLinkId}
              className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {deletingLinkId ? "Deleting..." : "Delete"}
            </button>
          </div>
        </AnchoredPopup>
      )}
    </div>
  );
}

type LinkItemProps = {
  link: Link;
  index: number;
  totalLinks: number;
  editingId: string | null;
  isOffline: boolean;
  onEdit: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<Link>) => Promise<void>;
  onDelete: (link: Link, button: HTMLButtonElement) => void;
  onToggleActive: (link: Link) => Promise<void>;
  onMove: (index: number, direction: "up" | "down") => void;
};

function LinkItem({
  link,
  index,
  totalLinks,
  editingId,
  isOffline,
  onEdit,
  onUpdate,
  onDelete,
  onToggleActive,
  onMove,
}: LinkItemProps) {
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const isEditing = editingId === link.id;
  const [showEditShell, setShowEditShell] = useState(isEditing);

  useEffect(() => {
    let timeoutId: number | undefined;

    if (isEditing) {
      setShowEditShell(true);
    } else if (showEditShell) {
      timeoutId = window.setTimeout(() => {
        setShowEditShell(false);
      }, 220);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isEditing, showEditShell]);

  const handleSave = async () => {
    await onUpdate(link.id, { title, url });
    onEdit(null);
  };

  const handleCancel = () => {
    setTitle(link.title);
    setUrl(link.url);
    onEdit(null);
  };

  if (showEditShell) {
    return (
      <div
        className={`overflow-hidden rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm ${
          isEditing ? "motion-inline-enter" : "motion-inline-exit"
        }`}
      >
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 outline-none transition-all bg-white/50"
            placeholder="Title"
          />

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 outline-none transition-all bg-white/50"
            placeholder="URL"
          />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-500 text-white rounded-xl hover:from-rose-600 hover:to-purple-600 transition font-semibold"
            >
              <Check className="w-4 h-4" />
              Save
            </button>

            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition font-semibold"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-5 border rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md ${link.is_active
          ? "bg-white border-gray-200"
          : "bg-gray-50 border-gray-200 opacity-60"
        }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onMove(index, "up")}
            disabled={index === 0}
            className="p-2 hover:bg-gray-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ArrowUp className="w-4 h-4 text-gray-500" />
          </button>

          <button
            onClick={() => onMove(index, "down")}
            disabled={index === totalLinks - 1}
            className="p-2 hover:bg-gray-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ArrowDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 truncate">{link.title}</div>
          <div className="text-sm text-gray-500 truncate">{link.url}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleActive(link)}
            disabled={isOffline}
            className="p-2 hover:bg-gray-100 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
            title={link.is_active ? "Hide link" : "Show link"}
          >
            {link.is_active ? (
              <Eye className="w-4 h-4 text-gray-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </button>

          <button
            onClick={() => onEdit(link.id)}
            disabled={isOffline}
            className="p-2 hover:bg-gray-100 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>

          <button
            onClick={(e) => onDelete(link, e.currentTarget)}
            disabled={isOffline}
            className="p-2 hover:bg-red-50 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
