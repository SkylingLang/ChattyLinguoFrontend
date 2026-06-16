export type UserProfile = {
  telegram_user_id: number;
  name?: string | null;
  username?: string | null;
  native_language: string;
  english_level: string;
  selected_voice: string;
  voice_enabled: boolean;
  voice_speed: number;
  selected_topics: string[];
  subscription_status: string;
  subscription_plan?: string | null;
  word_count: number;
  correct_messages_count: number;
  stars_count: number;
  tickets_count: number;
  daily_message_stars_count: number;
  daily_message_stars_date?: string | null;
  correct_percent: number;
  current_streak: number;
  maximum_streak: number;
  messages_count: number;
  voice_messages_count: number;
  practice_days: number;
  last_active_date?: string | null;
  active_dates: string[];
};

export type ChatMessage = {
  id: number;
  role: string;
  type: string;
  text?: string | null;
  transcript?: string | null;
  audio_file_id?: string | null;
  correction?: string | null;
  created_at: string;
};

export type WordDefinition = {
  word: string;
  translation?: string | null;
  definition?: string | null;
  examples: string[];
  part_of_speech?: string | null;
  pronunciation?: string | null;
  antonyms: string[];
  saved: boolean;
};

export type SavedWord = WordDefinition & {
  id: number;
  saved_at: string;
};

export type ExplainResult = {
  original_text: string;
  corrected_text: string;
  explanation: string;
  chatty_text?: string | null;
};

export type PronunciationScore = {
  transcript: string;
  accuracy_score: number;
  fluency_score: number;
  prosody_score: number;
  grammar_score: number;
  vocabulary_score: number;
  topic_score: number;
  feedback?: string | null;
};

export type TranslationResult = {
  original_text: string;
  translated_text: string;
  word_by_word: Array<{
    word: string;
    translation: string;
  }>;
};

export type ExchangeStarsResult = {
  stars_count: number;
  tickets_count: number;
  daily_message_stars_count: number;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          query_id?: string;
          user?: {
            id?: number;
            photo_url?: string;
          };
        };
        platform?: string;
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
        sendData?: (data: string) => void;
      };
    };
  }
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

function telegramInitData() {
  if (typeof window === 'undefined') return '';
  return window.Telegram?.WebApp?.initData ?? '';
}

function telegramUserId() {
  if (typeof window === 'undefined') return '1';
  return new URLSearchParams(window.location.search).get('telegram_user_id') ?? '1';
}

export function telegramUserPhotoUrl() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url ?? null;
}

function url(path: string) {
  const target = new URL(`${baseUrl}${path}`, window.location.origin);
  if (!telegramInitData()) {
    target.searchParams.set('telegram_user_id', telegramUserId());
  }
  return target;
}

function headers(json = false) {
  const initData = telegramInitData();
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(initData ? { 'X-Telegram-Init-Data': initData } : {})
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const target = url(path);
  const response = await fetch(target, {
    ...init,
    headers: {
      ...headers(init?.body !== undefined),
      ...init?.headers
    }
  });

  if (!response.ok) {
    const body = await response.text();
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/html') || body.trim().startsWith('<!DOCTYPE')) {
      throw new Error(
        `Backend API did not respond at ${target.origin}. Set NEXT_PUBLIC_API_BASE_URL to your FastAPI backend URL in Vercel, then redeploy.`
      );
    }
    throw new Error(body || `Request failed with ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  try {
    return await response.json() as T;
  } catch {
    throw new Error(`Backend returned a non-JSON response for ${target.pathname}. Check NEXT_PUBLIC_API_BASE_URL.`);
  }
}

export const api = {
  getProfile: () => request<UserProfile>('/api/profile'),
  exchangeStars: () => request<ExchangeStarsResult>('/api/profile/stars/exchange', { method: 'POST' }),
  getSavedWords: () => request<SavedWord[]>('/api/learning/saved-words'),
  getMessage: (messageId: number) => request<ChatMessage>(`/api/learning/messages/${messageId}`),
  defineWord: (word: string) => request<WordDefinition>(`/api/learning/word/${encodeURIComponent(word)}`),
  translateText: (text: string, targetLanguage: string) =>
    request<TranslationResult>('/api/learning/translate', {
      method: 'POST',
      body: JSON.stringify({ text, target_language: targetLanguage })
    }),
  getScore: (messageId: number) => request<PronunciationScore>(`/api/learning/messages/${messageId}/score`),
  getExplanation: (messageId: number) => request<ExplainResult>(`/api/learning/messages/${messageId}/explain`),
  askExplanationFollowUp: async (messageId: number, question: string) => {
    const body = await request<{ answer: string }>(`/api/learning/messages/${messageId}/explain/follow-up`, {
      method: 'POST',
      body: JSON.stringify({ question })
    });
    return body.answer;
  },
  saveWord: (entry: WordDefinition) =>
    request<SavedWord>('/api/learning/saved-words', {
      method: 'POST',
      body: JSON.stringify({
        word: entry.word,
        translation: entry.translation,
        definition: entry.definition,
        examples: entry.examples,
        part_of_speech: entry.part_of_speech,
        pronunciation: entry.pronunciation,
        antonyms: entry.antonyms
      })
    }),
  removeWord: (word: string) =>
    request<void>(`/api/learning/saved-words/${encodeURIComponent(word)}`, {
      method: 'DELETE'
    }),
  updateLanguage: (language: string) =>
    request<UserProfile>('/api/profile/language', {
      method: 'PATCH',
      body: JSON.stringify({ native_language: language })
    }),
  updateLevel: (level: string) =>
    request<UserProfile>('/api/profile/level', {
      method: 'PATCH',
      body: JSON.stringify({ english_level: level })
    }),
  updateVoice: (voice: string, enabled: boolean) =>
    request<UserProfile>('/api/profile/voice', {
      method: 'PATCH',
      body: JSON.stringify({ selected_voice: voice, voice_enabled: enabled })
    }),
  updateVoiceSpeed: (speed: number) =>
    request<UserProfile>('/api/profile/voice-speed', {
      method: 'PATCH',
      body: JSON.stringify({ voice_speed: speed })
    }),
  updateTopics: (topics: string[]) =>
    request<UserProfile>('/api/profile/topics', {
      method: 'PATCH',
      body: JSON.stringify({ selected_topics: topics })
    }),
  answerWebAppCommand: (queryId: string, command: string) =>
    request<{ ok: boolean }>('/telegram/web-app-command', {
      method: 'POST',
      body: JSON.stringify({ query_id: queryId, command })
    })
};

export function displayMessage(message?: ChatMessage | null) {
  return message?.text || message?.transcript || '';
}
