"use client";

import { useEffect, useMemo, useState } from "react";
import { api, bootTelegramApp } from "@/lib/api";
import type { SavedWord, UserProfile } from "@/lib/types";

type Tab = "profile" | "saved" | "stars" | "language" | "settings";

const tabs: Array<{ key: Tab; label: string; icon: string; tone: string }> = [
  { key: "profile", label: "Profile", icon: "A", tone: "avatar" },
  { key: "saved", label: "Saved", icon: "B", tone: "blue" },
  { key: "stars", label: "Stars", icon: "*", tone: "gold" },
  { key: "language", label: "Language", icon: "G", tone: "violet" },
  { key: "settings", label: "Settings", icon: "A", tone: "avatar" },
];

const languages = [
  ["FR", "French"],
  ["DE", "German"],
  ["ES", "Spanish"],
  ["JP", "Japanese"],
  ["CN", "Chinese"],
  ["IT", "Italian"],
  ["KR", "Korean"],
  ["PT", "Portuguese"],
  ["RU", "Russian"],
  ["SA", "Arabic"],
  ["TR", "Turkish"],
  ["PL", "Polish"],
  ["KZ", "Kazakh"],
  ["UZ", "Uzbek"],
];

const voices = ["Alex", "Eric", "Henry", "James", "Alexa", "Emily"];
const levels = [
  "Beginner",
  "Elementary",
  "Pre-Intermediate",
  "Intermediate",
  "Upper-Intermediate",
  "Advanced",
  "Native",
];
const topics = [
  "Travel and Culture",
  "Food and Cooking",
  "Music and Art",
  "Sports and Fitness",
  "Technology and Social Media",
];

export default function MiniAppPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    bootTelegramApp();
    Promise.all([api.profile(), api.savedWords()])
      .then(([nextProfile, words]) => {
        setProfile(nextProfile);
        setSavedWords(words);
      })
      .catch(() => setError("Open the bot with /start first, then reopen this Mini App."))
      .finally(() => setLoading(false));
  }, []);

  async function updateProfile(next: Promise<UserProfile>) {
    setProfile(await next);
  }

  const content = useMemo(() => {
    if (loading) return <EmptyPanel>Loading...</EmptyPanel>;
    if (error || !profile) return <EmptyPanel>{error}</EmptyPanel>;

    if (tab === "profile") return <ProfileScreen profile={profile} />;
    if (tab === "saved") return <SavedScreen words={savedWords} />;
    if (tab === "stars") return <StarsScreen profile={profile} />;
    if (tab === "language") {
      return <LanguageScreen profile={profile} onChange={(language) => updateProfile(api.updateLanguage(language))} />;
    }
    return <SettingsScreen profile={profile} onChange={updateProfile} />;
  }, [error, loading, profile, savedWords, tab]);

  return (
    <main className="shell">
      <section className="screen">{content}</section>
      <nav className="tabs" aria-label="Mini App navigation">
        {tabs.map((item) => (
          <button
            key={item.key}
            className={`tab ${tab === item.key ? "active" : ""}`}
            type="button"
            onClick={() => setTab(item.key)}
          >
            <span className={`tabIcon ${item.tone}`}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}

function ProfileScreen({ profile }: { profile: UserProfile }) {
  return (
    <div className="page profilePage">
      <Avatar size="large" />
      <h1>{profile.name || "Learner"}</h1>
      <div className="starsLine"><span className="goldText">★</span> 0</div>

      <div className="buttonStack">
        <button className="primaryPill" type="button">Invite Friends</button>
        <button className="secondaryPill" type="button">Share Profile</button>
      </div>

      <section className="panel streakPanel">
        <div className="streakHero">
          <span className="flame">●</span>
          <strong>{profile.current_streak || 1}</strong>
        </div>
        <p>days streak</p>
        <Calendar />
      </section>

      <section className="panel statGrid">
        <Stat value={profile.word_count} label="Words Said" />
        <Stat value={profile.maximum_streak || 1} label="Max streak" />
        <Stat value="0%" label="Correct" />
        <Stat value={profile.messages_count} label="Messages Sent" />
      </section>
    </div>
  );
}

function Calendar() {
  const days = [27, 28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];

  return (
    <div className="calendar">
      <div className="calendarHead">
        <button type="button">‹</button>
        <span>May 2026</span>
        <button type="button">›</button>
      </div>
      <div className="calendarGrid">
        {days.map((day, index) => {
          const weekend = index % 7 === 5 || index % 7 === 6;
          const today = day === 28 && index > 20;
          const previous = day === 27 && index > 20;
          return (
            <span
              key={`${day}-${index}`}
              className={`${weekend ? "weekend" : ""} ${today ? "today" : ""} ${previous ? "previous" : ""}`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function SavedScreen({ words }: { words: SavedWord[] }) {
  if (!words.length) {
    return (
      <div className="page">
        <section className="panel savedEmpty">
          <p>You don&apos;t have any words saved yet! To save a word:</p>
          <ol>
            <li><span>1</span> Open transcription of a Chatty response</li>
            <li><span>2</span> Click on a word you want to save</li>
            <li><span>3</span> Click bookmark icon</li>
          </ol>
        </section>
      </div>
    );
  }

  return (
    <div className="page listPage">
      {words.map((word) => (
        <section className="panel wordCard" key={word.id}>
          <h2>{word.word}</h2>
          {word.translation && <p>{word.translation}</p>}
          {word.definition && <small>{word.definition}</small>}
        </section>
      ))}
    </div>
  );
}

function StarsScreen({ profile }: { profile: UserProfile }) {
  return (
    <div className="page">
      <section className="panel starsPanel">
        <h2>Chatty Unlimited</h2>
        <p><span>✓</span> Unlimited messages and audio</p>
        <p><span>✓</span> You can unsubscribe at any time</p>
        <p><span>✓</span> Subscribers are more likely to improve their level</p>
        <button className="primaryPill" type="button">Monthly subscription · $9.99/month</button>
        <button className="primaryPill" type="button">Yearly subscription · $49.99/year</button>
        <small>Status: {profile.subscription_status}</small>
      </section>
    </div>
  );
}

function LanguageScreen({
  profile,
  onChange,
}: {
  profile: UserProfile;
  onChange: (language: string) => void;
}) {
  return (
    <div className="page listPage">
      <div className="languageList">
        {languages.map(([code, language]) => (
          <button
            key={language}
            className={`listRow languageRow ${profile.native_language === language ? "selected" : ""}`}
            type="button"
            onClick={() => onChange(language)}
          >
            <Avatar />
            <span className="langCode">{code}</span>
            <strong>{language}</strong>
            <Chevron />
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsScreen({
  profile,
  onChange,
}: {
  profile: UserProfile;
  onChange: (next: Promise<UserProfile>) => void;
}) {
  const voiceIndex = Math.max(0, voices.indexOf(profile.selected_voice));
  const levelIndex = Math.max(0, levels.indexOf(profile.english_level));
  const nextSpeed = profile.voice_speed >= 1.5 ? 0.75 : Number((profile.voice_speed + 0.25).toFixed(2));

  return (
    <div className="page listPage">
      <div className="settingsGroup single">
        <SettingsRow icon="♥" label="Get unlimited access" tone="pink" muted />
      </div>
      <div className="settingsGroup">
        <SettingsRow icon="+" label="Invite friends" tone="blue" />
        <SettingsRow icon="□" label="Gift subscription" tone="cyan" />
      </div>
      <div className="settingsGroup">
        <SettingsRow icon="•••" label="Change mode" tone="orange" />
        <SettingsRow
          icon="M"
          label={`Change Chatty voice · ${profile.selected_voice}`}
          tone="purple"
          onClick={() => onChange(api.updateVoice(voices[(voiceIndex + 1) % voices.length]))}
        />
        <SettingsRow
          icon="▥"
          label={`Change your English level · ${profile.english_level}`}
          tone="purple"
          onClick={() => onChange(api.updateLevel(levels[(levelIndex + 1) % levels.length]))}
        />
        <SettingsRow
          icon="◷"
          label={`Change Chatty voice speed · ${profile.voice_speed}x`}
          tone="green"
          onClick={() => onChange(api.updateVoiceSpeed(nextSpeed))}
        />
        <SettingsRow icon="≡" label="Choose topics" tone="sky" />
        <div className="topicWrap">
          {topics.map((topic) => {
            const selected = profile.selected_topics.includes(topic);
            const next = selected
              ? profile.selected_topics.filter((item) => item !== topic)
              : [...profile.selected_topics, topic];
            return (
              <button
                type="button"
                className={`topicChip ${selected ? "selected" : ""}`}
                key={topic}
                onClick={() => onChange(api.updateTopics(next))}
              >
                {topic}
              </button>
            );
          })}
        </div>
      </div>
      <div className="settingsGroup single">
        <SettingsRow icon="?" label="How to use Chatty" tone="cyan" />
      </div>
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  tone,
  muted = false,
  onClick,
}: {
  icon: string;
  label: string;
  tone: string;
  muted?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={`listRow settingsRow ${muted ? "muted" : ""}`} type="button" onClick={onClick}>
      <span className={`squareIcon ${tone}`}>{icon}</span>
      <strong>{label}</strong>
      <Chevron />
    </button>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="page">
      <section className="panel emptyPanel">{children}</section>
    </div>
  );
}

function Chevron() {
  return <span className="chevron">›</span>;
}

function Avatar({ size = "small" }: { size?: "small" | "large" }) {
  return (
    <span className={`avatar ${size}`}>
      <span className="avatarHair" />
      <span className="avatarFace" />
    </span>
  );
}
