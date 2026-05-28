import { useEffect, useState } from "react";
import { Bookmark, Globe2, Mic, Settings, Star, UserRound } from "lucide-react";
import { api } from "./api/client";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SavedScreen } from "./screens/SavedScreen";
import { StarsScreen } from "./screens/StarsScreen";
import { LanguageScreen } from "./screens/LanguageScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { Tab, UserProfile } from "./types";

const tabs: Array<{ id: Tab; label: string; icon: JSX.Element }> = [
  { id: "profile", label: "Profile", icon: <UserRound /> },
  { id: "saved", label: "Saved", icon: <Bookmark /> },
  { id: "stars", label: "Stars", icon: <Star /> },
  { id: "language", label: "Language", icon: <Globe2 /> },
  { id: "settings", label: "Settings", icon: <Settings /> }
];

export function App() {
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .profile()
      .then(setProfile)
      .catch(() => setError("Open the bot with /start first, then reopen this Mini App."));
  }, []);

  const content = (() => {
    if (error) return <div className="empty-card">{error}</div>;
    if (!profile) return <div className="empty-card">Loading...</div>;
    if (tab === "profile") return <ProfileScreen profile={profile} />;
    if (tab === "saved") return <SavedScreen />;
    if (tab === "stars") return <StarsScreen profile={profile} />;
    if (tab === "language") {
      return <LanguageScreen profile={profile} onChange={setProfile} />;
    }
    return <SettingsScreen profile={profile} onChange={setProfile} />;
  })();

  return (
    <main className="app-shell">
      <section className="content">{content}</section>
      <nav className="tabbar" aria-label="Mini App tabs">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={`tab-button ${tab === item.id ? "active" : ""}`}
            onClick={() => setTab(item.id)}
            title={item.label}
          >
            <span className="tab-icon">{item.id === "settings" ? <Mic /> : item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}

