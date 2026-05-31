class UserProfile {
  const UserProfile({
    required this.telegramUserId,
    required this.nativeLanguage,
    required this.englishLevel,
    required this.selectedVoice,
    required this.voiceEnabled,
    required this.voiceSpeed,
    required this.selectedTopics,
    required this.subscriptionStatus,
    required this.wordCount,
    required this.correctMessagesCount,
    required this.correctPercent,
    required this.currentStreak,
    required this.maximumStreak,
    required this.messagesCount,
    required this.voiceMessagesCount,
    required this.practiceDays,
    required this.activeDates,
    this.name,
    this.username,
    this.subscriptionPlan,
    this.lastActiveDate,
  });

  final int telegramUserId;
  final String? name;
  final String? username;
  final String nativeLanguage;
  final String englishLevel;
  final String selectedVoice;
  final bool voiceEnabled;
  final double voiceSpeed;
  final List<String> selectedTopics;
  final String subscriptionStatus;
  final String? subscriptionPlan;
  final int wordCount;
  final int correctMessagesCount;
  final int correctPercent;
  final int currentStreak;
  final int maximumStreak;
  final int messagesCount;
  final int voiceMessagesCount;
  final int practiceDays;
  final String? lastActiveDate;
  final List<String> activeDates;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      telegramUserId: json['telegram_user_id'] as int? ?? 1,
      name: json['name'] as String?,
      username: json['username'] as String?,
      nativeLanguage: json['native_language'] as String? ?? 'English',
      englishLevel: json['english_level'] as String? ?? 'Intermediate',
      selectedVoice: json['selected_voice'] as String? ?? 'Alexa',
      voiceEnabled: json['voice_enabled'] as bool? ?? true,
      voiceSpeed: (json['voice_speed'] as num?)?.toDouble() ?? 1,
      selectedTopics:
          List<String>.from(json['selected_topics'] as List? ?? const []),
      subscriptionStatus: json['subscription_status'] as String? ?? 'free',
      subscriptionPlan: json['subscription_plan'] as String?,
      wordCount: json['word_count'] as int? ?? 0,
      correctMessagesCount: json['correct_messages_count'] as int? ?? 0,
      correctPercent: json['correct_percent'] as int? ?? 0,
      currentStreak: json['current_streak'] as int? ?? 0,
      maximumStreak: json['maximum_streak'] as int? ?? 0,
      messagesCount: json['messages_count'] as int? ?? 0,
      voiceMessagesCount: json['voice_messages_count'] as int? ?? 0,
      practiceDays: json['practice_days'] as int? ?? 0,
      lastActiveDate: json['last_active_date'] as String?,
      activeDates: List<String>.from(json['active_dates'] as List? ?? const []),
    );
  }
}

class SavedWord {
  const SavedWord({
    required this.id,
    required this.word,
    required this.examples,
    required this.antonyms,
    required this.savedAt,
    this.translation,
    this.definition,
    this.partOfSpeech,
    this.pronunciation,
  });

  final int id;
  final String word;
  final String? translation;
  final String? definition;
  final List<String> examples;
  final String? partOfSpeech;
  final String? pronunciation;
  final List<String> antonyms;
  final String savedAt;

  factory SavedWord.fromJson(Map<String, dynamic> json) {
    return SavedWord(
      id: json['id'] as int,
      word: json['word'] as String,
      translation: json['translation'] as String?,
      definition: json['definition'] as String?,
      examples: List<String>.from(json['examples'] as List? ?? const []),
      partOfSpeech: json['part_of_speech'] as String?,
      pronunciation: json['pronunciation'] as String?,
      antonyms: List<String>.from(json['antonyms'] as List? ?? const []),
      savedAt: json['saved_at'] as String? ?? '',
    );
  }
}

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.role,
    required this.type,
    required this.createdAt,
    this.text,
    this.transcript,
    this.audioFileId,
    this.correction,
  });

  final int id;
  final String role;
  final String type;
  final String? text;
  final String? transcript;
  final String? audioFileId;
  final String? correction;
  final String createdAt;

  String get displayText => text ?? transcript ?? '';

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as int,
      role: json['role'] as String? ?? '',
      type: json['type'] as String? ?? '',
      text: json['text'] as String?,
      transcript: json['transcript'] as String?,
      audioFileId: json['audio_file_id'] as String?,
      correction: json['correction'] as String?,
      createdAt: json['created_at'] as String? ?? '',
    );
  }
}

class WordDefinition {
  const WordDefinition({
    required this.word,
    required this.examples,
    required this.antonyms,
    required this.saved,
    this.translation,
    this.definition,
    this.partOfSpeech,
    this.pronunciation,
  });

  final String word;
  final String? translation;
  final String? definition;
  final List<String> examples;
  final String? partOfSpeech;
  final String? pronunciation;
  final List<String> antonyms;
  final bool saved;

  factory WordDefinition.fromJson(Map<String, dynamic> json) {
    return WordDefinition(
      word: json['word'] as String? ?? '',
      translation: json['translation'] as String?,
      definition: json['definition'] as String?,
      examples: List<String>.from(json['examples'] as List? ?? const []),
      partOfSpeech: json['part_of_speech'] as String?,
      pronunciation: json['pronunciation'] as String?,
      antonyms: List<String>.from(json['antonyms'] as List? ?? const []),
      saved: json['saved'] as bool? ?? false,
    );
  }
}

class PronunciationScore {
  const PronunciationScore({
    required this.transcript,
    required this.accuracyScore,
    required this.fluencyScore,
    required this.prosodyScore,
    required this.grammarScore,
    required this.vocabularyScore,
    required this.topicScore,
    this.feedback,
  });

  final String transcript;
  final int accuracyScore;
  final int fluencyScore;
  final int prosodyScore;
  final int grammarScore;
  final int vocabularyScore;
  final int topicScore;
  final String? feedback;

  factory PronunciationScore.fromJson(Map<String, dynamic> json) {
    return PronunciationScore(
      transcript: json['transcript'] as String? ?? '',
      accuracyScore: json['accuracy_score'] as int? ?? 0,
      fluencyScore: json['fluency_score'] as int? ?? 0,
      prosodyScore: json['prosody_score'] as int? ?? 0,
      grammarScore: json['grammar_score'] as int? ?? 0,
      vocabularyScore: json['vocabulary_score'] as int? ?? 0,
      topicScore: json['topic_score'] as int? ?? 0,
      feedback: json['feedback'] as String?,
    );
  }
}

class ExplainResult {
  const ExplainResult({
    required this.originalText,
    required this.correctedText,
    required this.explanation,
    this.chattyText,
  });

  final String originalText;
  final String correctedText;
  final String explanation;
  final String? chattyText;

  factory ExplainResult.fromJson(Map<String, dynamic> json) {
    return ExplainResult(
      originalText: json['original_text'] as String? ?? '',
      correctedText: json['corrected_text'] as String? ?? '',
      explanation: json['explanation'] as String? ?? '',
      chattyText: json['chatty_text'] as String?,
    );
  }
}
