import { useState, useEffect, useRef } from "react";
import { supabase, Profile, Link } from "../lib/supabase";
import { ExternalLink, Link2, Globe } from "lucide-react";
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
  FaPinterest,
  FaTiktok,
  FaReddit,
  FaMedium,
  FaStackOverflow,
  FaGoogleDrive,
} from "react-icons/fa";

type PublicProfileProps = {
  username: string;
};

export function PublicProfile({ username }: PublicProfileProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showFullAvatar, setShowFullAvatar] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // logged in user id
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  // prevent duplicate view tracking
  const viewTracked = useRef(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data?.user?.id || null);
      setAuthLoaded(true);
    };

    getCurrentUser();
  }, []);

  useEffect(() => {
    loadProfile();
    viewTracked.current = false; // reset when username changes
  }, [username]);

  useEffect(() => {
    if (authLoaded && profile && !viewTracked.current) {
      trackProfileView(profile);
    }
  }, [authLoaded, profile]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setNotFound(false);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username.toLowerCase())
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: linksData, error: linksError } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", profileData.id)
        .eq("is_active", true)
        .order("position", { ascending: true });

      if (linksError) throw linksError;

      setLinks(linksData || []);
    } catch (error) {
      console.error("Error loading profile:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Track profile view only once and only if visitor is not owner
  const trackProfileView = async (profileData: Profile) => {
    if (viewTracked.current) return;

    // don't track if owner
    if (currentUserId === profileData.id) {
      viewTracked.current = true;
      return;
    }

    try {
      await supabase.from("profile_views").insert({
        profile_id: profileData.id,
        user_agent: navigator.userAgent,
      });

      viewTracked.current = true;
    } catch (error) {
      console.error("Error tracking profile view:", error);
    }
  };

  // ✅ Track Link Click only if visitor is not owner
  const handleLinkClick = async (link: Link) => {
    if (!profile) return;

    if (currentUserId === profile.id) return;

    try {
      await supabase.from("link_clicks").insert({
        link_id: link.id,
        profile_id: profile.id,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error("Error tracking link click:", error);
    }
  };

  const getLinkIcon = (link: Link) => {
    const platform = (link.platform || "custom").toLowerCase();
    const lowerUrl = link.url.toLowerCase();

    if (platform === "github") return <FaGithub className="w-5 h-5 text-gray-800" />;
    if (platform === "linkedin") return <FaLinkedin className="w-5 h-5 text-blue-600" />;
    if (platform === "instagram") return <FaInstagram className="w-5 h-5 text-pink-600" />;
    if (platform === "youtube") return <FaYoutube className="w-5 h-5 text-red-600" />;
    if (platform === "facebook") return <FaFacebook className="w-5 h-5 text-blue-700" />;
    if (platform === "twitter") return <FaXTwitter className="w-5 h-5 text-black" />;
    if (platform === "tiktok") return <FaTiktok className="w-5 h-5 text-black" />;
    if (platform === "pinterest") return <FaPinterest className="w-5 h-5 text-red-600" />;
    if (platform === "reddit") return <FaReddit className="w-5 h-5 text-orange-600" />;
    if (platform === "snapchat") return <FaSnapchatGhost className="w-5 h-5 text-yellow-500" />;
    if (platform === "discord") return <FaDiscord className="w-5 h-5 text-purple-600" />;
    if (platform === "telegram") return <FaTelegram className="w-5 h-5 text-blue-500" />;
    if (platform === "whatsapp") return <FaWhatsapp className="w-5 h-5 text-green-600" />;
    if (platform === "medium") return <FaMedium className="w-5 h-5 text-black" />;
    if (platform === "stackoverflow") return <FaStackOverflow className="w-5 h-5 text-orange-500" />;
    if (platform === "googledrive") return <FaGoogleDrive className="w-5 h-5 text-green-500" />;
    if (platform === "portfolio") return <Globe className="w-5 h-5 text-green-600" />;

    // fallback url detection
    if (lowerUrl.includes("reddit.com")) return <FaReddit className="w-5 h-5 text-orange-600" />;
    if (lowerUrl.includes("snapchat.com")) return <FaSnapchatGhost className="w-5 h-5 text-yellow-500" />;
    if (lowerUrl.includes("wa.me") || lowerUrl.includes("whatsapp.com"))
      return <FaWhatsapp className="w-5 h-5 text-green-600" />;

    return <Globe className="w-5 h-5 text-green-600" />;
  };


  const getInitials = () => {
    return (
      profile?.display_name?.[0]?.toUpperCase() ||
      profile?.username?.[0]?.toUpperCase() ||
      "U"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-3xl flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white/80 font-medium">
            Loading public profile...
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-3xl mb-5 shadow-lg glow-indigo">
            <Link2 className="w-10 h-10 text-white/70" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">
            Profile Not Found
          </h1>
          <p className="text-white/60">
            The profile you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto animate-fadeIn">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            {profile?.avatar_url && !avatarError ? (
              <img
                src={profile.avatar_url}
                alt="avatar"
                onError={() => setAvatarError(true)}
                onClick={() => setShowFullAvatar(true)}
                className="w-32 h-32 rounded-full object-cover shadow-xl border-4 border-white/20 glow-purple cursor-pointer hover:scale-105 transition-transform"
              />
            ) : (
              <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-indigo-500 via-violet-500 to-teal-500 rounded-full text-white text-4xl font-extrabold shadow-xl glow-indigo">
                {getInitials()}
              </div>
            )}
          </div>

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

          {profile?.display_name && (
            <h1 className="text-4xl font-extrabold text-white mb-3">
              {profile.display_name}
            </h1>
          )}

          <p className="text-lg text-white/50 mb-5 font-medium">
            @{profile?.username}
          </p>

          {profile?.bio && (
            <p className="text-white/70 max-w-md mx-auto leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {links.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/50 font-medium">
                No links available yet
              </p>
            </div>
          ) : (
            links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                // keep href for accessibility/fallback, but open programmatically
                onClick={(e) => {
                  e.preventDefault();
                  // open in new tab without causing current tab navigation
                  window.open(link.url, "_blank", "noopener,noreferrer");
                  // track the click (fire-and-forget)
                  void handleLinkClick(link);
                }}
                className="block w-full p-5 glass-link-card rounded-2xl transition-all duration-300 group hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/10 group-hover:bg-white/20 transition">
                      {getLinkIcon(link)}
                    </div>

                    <span className="text-lg font-medium text-white/90 group-hover:text-white transition-colors">
                      {link.title}
                    </span>
                  </div>

                  <ExternalLink className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors" />
                </div>
              </a>
            ))
          )}
        </div>

        <div className="text-center mt-14">
          <p className="text-sm text-white/40">
            Create your own link page with{" "}
            <a
              href="/"
              className="text-indigo-400 hover:text-indigo-300 transition font-semibold"
            >
              LinkNest
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
