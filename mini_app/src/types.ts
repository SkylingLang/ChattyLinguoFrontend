export type Tab = "profile" | "saved" | "stars" | "language" | "settings";

export type UserProfile = {
  telegram_user_id: number;
  name: string | null;
  username: string | null;
  native_language: string;
  english_level: string;
  selected_voice: string;
  voice_enabled: boolean;
  voice_speed: number;
  selected_topics: string[];
  subscription_status: string;
  subscription_plan: string | null;
  word_count: number;
  current_streak: number;
  maximum_streak: number;
  messages_count: number;
  voice_messages_count: number;
  practice_days: number;
  last_active_date: string | null;
};

export type SavedWord = {
  id: number;
  word: string;
  translation: string | null;
  definition: string | null;
  examples: string[];
  part_of_speech: string | null;
  pronunciation: string | null;
  antonyms: string[];
  saved_at: string;
};

