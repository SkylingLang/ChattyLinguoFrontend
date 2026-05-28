import type { SavedWord, UserProfile } from "./types";

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initDataUnsafe?: {
        user?: {
          id?: number | string;
        };
      };
      ready?: () => void;
      expand?: () => void;
    };
  };
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function bootTelegramApp() {
  const webApp = (window as TelegramWindow).Telegram?.WebApp;
  webApp?.ready?.();
  webApp?.expand?.();
}

export function getTelegramUserId() {
  const webAppId = (window as TelegramWindow).Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (webAppId) return Number(webAppId);

  const queryId = new URLSearchParams(window.location.search).get("telegram_user_id");
  if (queryId) return Number(queryId);

  const stored = window.localStorage.getItem("telegram_user_id");
  if (stored) return Number(stored);

  return 1;
}

function endpoint(path: string) {
  const url = new URL(`${baseUrl}${path}`, window.location.origin);
  url.searchParams.set("telegram_user_id", String(getTelegramUserId()));
  return url;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(endpoint(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

export const api = {
  profile: () => request<UserProfile>("/api/profile"),
  savedWords: () => request<SavedWord[]>("/api/learning/saved-words"),
  updateLanguage: (native_language: string) =>
    request<UserProfile>("/api/profile/language", {
      method: "PATCH",
      body: JSON.stringify({ native_language }),
    }),
  updateLevel: (english_level: string) =>
    request<UserProfile>("/api/profile/level", {
      method: "PATCH",
      body: JSON.stringify({ english_level }),
    }),
  updateVoice: (selected_voice: string, voice_enabled = true) =>
    request<UserProfile>("/api/profile/voice", {
      method: "PATCH",
      body: JSON.stringify({ selected_voice, voice_enabled }),
    }),
  updateVoiceSpeed: (voice_speed: number) =>
    request<UserProfile>("/api/profile/voice-speed", {
      method: "PATCH",
      body: JSON.stringify({ voice_speed }),
    }),
  updateTopics: (selected_topics: string[]) =>
    request<UserProfile>("/api/profile/topics", {
      method: "PATCH",
      body: JSON.stringify({ selected_topics }),
    }),
};
