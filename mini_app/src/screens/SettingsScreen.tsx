import { ChevronRight, Gift, HelpCircle, Heart, ListChecks, Mic, SlidersHorizontal, Users } from "lucide-react";
import { api } from "../api/client";
import { UserProfile } from "../types";

const voices = ["Alex", "Eric", "Henry", "James", "Alexa", "Emily"];
const levels = ["Beginner", "Elementary", "Pre-Intermediate", "Intermediate", "Upper-Intermediate", "Advanced", "Native"];
const topics = ["Travel and Culture", "Food and Cooking", "Music and Art", "Sports and Fitness", "Technology and Social Media"];

export function SettingsScreen({
  profile,
  onChange
}: {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
}) {
  async function cycleVoice() {
    const index = voices.indexOf(profile.selected_voice);
    onChange(await api.updateVoice(voices[(index + 1) % voices.length], true));
  }

  async function cycleLevel() {
    const index = levels.indexOf(profile.english_level);
    onChange(await api.updateLevel(levels[(index + 1) % levels.length]));
  }

  async function toggleTopic(topic: string) {
    const selected = profile.selected_topics.includes(topic)
      ? profile.selected_topics.filter((item) => item !== topic)
      : [...profile.selected_topics, topic];
    onChange(await api.updateTopics(selected));
  }

  return (
    <div className="screen settings-screen">
      <SettingsRow icon={<Heart />} label="Get unlimited access" muted />
      <div className="settings-group">
        <SettingsRow icon={<Users />} label="Invite friends" />
        <SettingsRow icon={<Gift />} label="Gift subscription" />
      </div>
      <div className="settings-group">
        <SettingsRow icon={<Users />} label="Change mode" />
        <SettingsRow icon={<Mic />} label={`Change Chatty voice · ${profile.selected_voice}`} onClick={cycleVoice} />
        <SettingsRow icon={<SlidersHorizontal />} label={`Change your English level · ${profile.english_level}`} onClick={cycleLevel} />
        <SettingsRow icon={<SlidersHorizontal />} label={`Change Chatty voice speed · ${profile.voice_speed}x`} />
        <SettingsRow icon={<ListChecks />} label="Choose topics" />
      </div>
      <div className="topic-chips">
        {topics.map((topic) => (
          <button
            key={topic}
            className={profile.selected_topics.includes(topic) ? "chip selected" : "chip"}
            onClick={() => toggleTopic(topic)}
          >
            {topic}
          </button>
        ))}
      </div>
      <SettingsRow icon={<HelpCircle />} label="How to use Chatty" />
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  muted,
  onClick
}: {
  icon: JSX.Element;
  label: string;
  muted?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={`settings-row ${muted ? "muted" : ""}`} onClick={onClick}>
      <span className="settings-icon">{icon}</span>
      <span>{label}</span>
      <ChevronRight className="chevron" />
    </button>
  );
}

