export type UserProfile = {
  id: number;
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
  subscription_expires_at: string | null;
  word_count: number;
  current_streak: number;
  maximum_streak: number;
  messages_count: number;
  voice_messages_count: number;
  practice_days: number;
  last_active_date: string | null;
  frequent_grammar_mistakes: string[];
  weak_vocabulary_topics: string[];
};

export type SavedWord = {
  id: number;
  word: string;
  translation: string | null;
  definition: string | null;
  examples: string[];
  created_at: string;
};
