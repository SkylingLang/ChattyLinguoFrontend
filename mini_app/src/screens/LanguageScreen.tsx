import { ChevronRight } from "lucide-react";
import { api } from "../api/client";
import { UserProfile } from "../types";

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
  ["KZ", "Kazakh"],
  ["TR", "Turkish"],
  ["UZ", "Uzbek"],
  ["EN", "English"]
];

export function LanguageScreen({
  profile,
  onChange
}: {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
}) {
  async function selectLanguage(language: string) {
    onChange(await api.updateLanguage(language));
  }

  return (
    <div className="screen language-list">
      {languages.map(([code, language]) => (
        <button
          key={language}
          className={`language-row ${profile.native_language === language ? "selected" : ""}`}
          onClick={() => selectLanguage(language)}
        >
          <span className="small-avatar">👩🏻</span>
          <span className="language-code">{code}</span>
          <strong>{language}</strong>
          <ChevronRight className="chevron" />
        </button>
      ))}
    </div>
  );
}

