import { SavedWord, UserProfile } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export function getTelegramUserId(): number {
  const tg = (window as any).Telegram?.WebApp;
  const id = tg?.initDataUnsafe?.user?.id;
  const fallback = new URLSearchParams(window.location.search).get("telegram_user_id");
  return Number(id ?? fallback ?? 1);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${API_BASE}${path}${separator}telegram_user_id=${getTelegramUserId()}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    ...options
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<T>;
}

export const api = {
  profile: () => request<UserProfile>("/api/profile"),
  stats: () => request<UserProfile>("/api/profile"),
  savedWords: () => request<SavedWord[]>("/api/learning/saved-words"),
  updateLanguage: (native_language: string) =>
    request<UserProfile>("/api/profile/language", {
      method: "PATCH",
      body: JSON.stringify({ native_language })
    }),
  updateLevel: (english_level: string) =>
    request<UserProfile>("/api/profile/level", {
      method: "PATCH",
      body: JSON.stringify({ english_level })
    }),
  updateVoice: (selected_voice: string, voice_enabled = true) =>
    request<UserProfile>("/api/profile/voice", {
      method: "PATCH",
      body: JSON.stringify({ selected_voice, voice_enabled })
    }),
  updateTopics: (selected_topics: string[]) =>
    request<UserProfile>("/api/profile/topics", {
      method: "PATCH",
      body: JSON.stringify({ selected_topics })
    }),
  checkout: (plan: "monthly" | "yearly") =>
    request<{ checkout_url: string }>("/api/subscriptions/checkout", {
      method: "POST",
      body: JSON.stringify({ plan })
    })
};

