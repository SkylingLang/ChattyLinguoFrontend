import 'package:flutter/material.dart';

import 'api_client.dart';
import 'models.dart';

void main() {
  runApp(const ChattyMiniApp());
}

class ChattyMiniApp extends StatelessWidget {
  const ChattyMiniApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ChattyLinguo',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff358fe8)),
        scaffoldBackgroundColor: Colors.white,
        fontFamily: 'Arial',
        useMaterial3: true,
      ),
      home: const MiniAppHome(),
    );
  }
}

class MiniAppHome extends StatefulWidget {
  const MiniAppHome({super.key});

  @override
  State<MiniAppHome> createState() => _MiniAppHomeState();
}

class _MiniAppHomeState extends State<MiniAppHome> {
  final ApiClient api = ApiClient();
  UserProfile? profile;
  int tabIndex = 0;
  String? error;

  int? get messageId {
    final raw = Uri.base.queryParameters['message_id'];
    return raw == null ? null : int.tryParse(raw);
  }

  String get mode => Uri.base.queryParameters['mode'] ?? '';

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final nextProfile = await api.getProfile();
      setState(() => profile = nextProfile);
    } catch (_) {
      setState(() =>
          error = 'Open the bot with /start first, then reopen this Mini App.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentProfile = profile;
    return Scaffold(
      body: SafeArea(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 680),
          child: Center(
            child: Builder(
              builder: (_) {
                if (error != null) {
                  return EmptyPanel(text: error!);
                }
                if (currentProfile == null) {
                  return const EmptyPanel(text: 'Loading...');
                }
                final currentMessageId = messageId;
                if (currentMessageId != null) {
                  if (mode == 'score') {
                    return ScoreScreen(api: api, messageId: currentMessageId);
                  }
                  if (mode == 'explain') {
                    return ExplainScreen(
                      api: api,
                      profile: currentProfile,
                      messageId: currentMessageId,
                      onLanguageChanged: (value) =>
                          setState(() => profile = value),
                    );
                  }
                  return TranscriptScreen(
                    api: api,
                    profile: currentProfile,
                    messageId: currentMessageId,
                    onLanguageChanged: (value) =>
                        setState(() => profile = value),
                  );
                }
                return IndexedStack(
                  index: tabIndex,
                  children: [
                    ProfileScreen(profile: currentProfile),
                    SavedScreen(api: api),
                    StarsScreen(profile: currentProfile),
                    LanguageScreen(
                      profile: currentProfile,
                      onChanged: (value) => setState(() => profile = value),
                      api: api,
                    ),
                    SettingsScreen(
                      profile: currentProfile,
                      onChanged: (value) => setState(() => profile = value),
                      api: api,
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      ),
      bottomNavigationBar: messageId != null
          ? null
          : NavigationBar(
              height: 78,
              selectedIndex: tabIndex,
              onDestinationSelected: (index) =>
                  setState(() => tabIndex = index),
              destinations: const [
                NavigationDestination(
                    icon: Icon(Icons.person), label: 'Profile'),
                NavigationDestination(
                    icon: Icon(Icons.bookmark), label: 'Saved'),
                NavigationDestination(icon: Icon(Icons.star), label: 'Stars'),
                NavigationDestination(
                    icon: Icon(Icons.language), label: 'Language'),
                NavigationDestination(
                    icon: Icon(Icons.settings), label: 'Settings'),
              ],
            ),
    );
  }
}

class TranscriptScreen extends StatefulWidget {
  const TranscriptScreen({
    required this.api,
    required this.profile,
    required this.messageId,
    required this.onLanguageChanged,
    super.key,
  });

  final ApiClient api;
  final UserProfile profile;
  final int messageId;
  final ValueChanged<UserProfile> onLanguageChanged;

  @override
  State<TranscriptScreen> createState() => _TranscriptScreenState();
}

class _TranscriptScreenState extends State<TranscriptScreen> {
  late Future<ChatMessage> message;

  @override
  void initState() {
    super.initState();
    message = widget.api.getMessage(widget.messageId);
  }

  Future<void> _showWord(String rawWord) async {
    final word = rawWord.replaceAll(RegExp(r"[^A-Za-z'-]"), '');
    if (word.isEmpty) return;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      enableDrag: false,
      isDismissible: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return FutureBuilder<WordDefinition>(
          future: widget.api.defineWord(word),
          builder: (context, snapshot) {
            return WordDefinitionSheet(
              api: widget.api,
              word: word,
              snapshot: snapshot,
            );
          },
        );
      },
    );
  }

  List<InlineSpan> _wordSpans(String text) {
    final matches = RegExp(r"\S+|\s+").allMatches(text);
    return matches.map((match) {
      final token = match.group(0) ?? '';
      if (token.trim().isEmpty) return TextSpan(text: token);
      return WidgetSpan(
        alignment: PlaceholderAlignment.baseline,
        baseline: TextBaseline.alphabetic,
        child: GestureDetector(
          onTap: () => _showWord(token),
          child: Text(
            token,
            style: const TextStyle(
              fontSize: 30,
              height: 1.35,
            ),
          ),
        ),
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<ChatMessage>(
      future: message,
      builder: (context, snapshot) {
        final text = snapshot.data?.displayText ?? '';
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Transcript',
                  style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800)),
              const SizedBox(height: 14),
              Panel(
                child: snapshot.connectionState == ConnectionState.waiting
                    ? const LinearProgressIndicator()
                    : RichText(
                        text: TextSpan(
                            style: const TextStyle(color: Colors.black),
                            children: _wordSpans(text))),
              ),
              const SizedBox(height: 22),
              const Text(
                'Tap any word to see the definition',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 22,
                    color: Color(0xff9a9da3),
                    fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 54),
              WideButton(
                text: widget.profile.nativeLanguage,
                color: const Color(0xfff3f3f5),
                textColor: Colors.black,
                onPressed: () => _pickLanguage(context),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _pickLanguage(BuildContext context) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => SizedBox(
        height: MediaQuery.of(context).size.height * 0.78,
        child: LanguageScreen(
          profile: widget.profile,
          api: widget.api,
          onChanged: (value) {
            widget.onLanguageChanged(value);
            Navigator.of(context).pop();
          },
        ),
      ),
    );
  }
}

class ExplainScreen extends StatefulWidget {
  const ExplainScreen({
    required this.api,
    required this.profile,
    required this.messageId,
    required this.onLanguageChanged,
    super.key,
  });

  final ApiClient api;
  final UserProfile profile;
  final int messageId;
  final ValueChanged<UserProfile> onLanguageChanged;

  @override
  State<ExplainScreen> createState() => _ExplainScreenState();
}

class _ExplainScreenState extends State<ExplainScreen> {
  late Future<ExplainResult> explanation;
  final TextEditingController followUpController = TextEditingController();
  final List<(String, String)> followUps = [];
  bool sending = false;

  @override
  void initState() {
    super.initState();
    explanation = widget.api.getExplanation(widget.messageId);
  }

  @override
  void dispose() {
    followUpController.dispose();
    super.dispose();
  }

  Future<void> _sendFollowUp() async {
    final question = followUpController.text.trim();
    if (question.isEmpty || sending) return;
    setState(() => sending = true);
    try {
      final answer =
          await widget.api.askExplanationFollowUp(widget.messageId, question);
      followUpController.clear();
      setState(() => followUps.add((question, answer)));
    } finally {
      if (mounted) setState(() => sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<ExplainResult>(
      future: explanation,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Padding(
            padding: EdgeInsets.all(18),
            child: Panel(child: LinearProgressIndicator()),
          );
        }
        if (snapshot.hasError || snapshot.data == null) {
          return const EmptyPanel(text: 'Could not load explanation.');
        }
        final data = snapshot.data!;
        return Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Panel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (data.chattyText != null &&
                          data.chattyText!.isNotEmpty)
                        _ExplainBubble(
                          title: 'Chatty',
                          text: data.chattyText!,
                          color: const Color(0xffdddddf),
                        ),
                      const SizedBox(height: 12),
                      _ExplainBubble(
                        title: widget.profile.name ?? 'You',
                        text: data.correctedText,
                        color: const Color(0xffd9f5dc),
                      ),
                      const SizedBox(height: 20),
                      Text(data.explanation,
                          style: const TextStyle(fontSize: 22, height: 1.35)),
                      ...followUps.map(
                        (item) => Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              _ExplainBubble(
                                title: widget.profile.name ?? 'You',
                                text: item.$1,
                                color: const Color(0xffd9f5dc),
                              ),
                              const SizedBox(height: 10),
                              _ExplainBubble(
                                title: 'Chatty',
                                text: item.$2,
                                color: const Color(0xffdddddf),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 18),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: followUpController,
                      decoration: InputDecoration(
                        hintText: 'Ask a follow-up question...',
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(28),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: const Color(0xffb9bdc4),
                    child: IconButton(
                      color: Colors.white,
                      icon: const Icon(Icons.arrow_upward),
                      onPressed: _sendFollowUp,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
              child: WideButton(
                text: widget.profile.nativeLanguage,
                color: const Color(0xfff3f3f5),
                textColor: Colors.black,
                onPressed: () {},
              ),
            ),
          ],
        );
      },
    );
  }
}

class _ExplainBubble extends StatelessWidget {
  const _ExplainBubble({
    required this.title,
    required this.text,
    required this.color,
  });

  final String title;
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style:
                  const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          Text(text, style: const TextStyle(fontSize: 24, height: 1.35)),
        ],
      ),
    );
  }
}

class WordDefinitionSheet extends StatefulWidget {
  const WordDefinitionSheet({
    required this.api,
    required this.word,
    required this.snapshot,
    super.key,
  });

  final ApiClient api;
  final String word;
  final AsyncSnapshot<WordDefinition> snapshot;

  @override
  State<WordDefinitionSheet> createState() => _WordDefinitionSheetState();
}

class _WordDefinitionSheetState extends State<WordDefinitionSheet> {
  bool saved = false;

  Future<void> _save(WordDefinition entry) async {
    await widget.api.saveWord(entry);
    if (mounted) setState(() => saved = true);
  }

  @override
  Widget build(BuildContext context) {
    final entry = widget.snapshot.data;
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 18,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxHeight: 520),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(widget.word,
                        style: const TextStyle(
                            fontSize: 34, fontWeight: FontWeight.w800)),
                  ),
                  IconButton(
                    iconSize: 34,
                    icon: Icon(saved || (entry?.saved ?? false)
                        ? Icons.bookmark
                        : Icons.bookmark_border),
                    onPressed: entry == null ? null : () => _save(entry),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              if (widget.snapshot.connectionState == ConnectionState.waiting)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: LinearProgressIndicator(),
                )
              else if (widget.snapshot.hasError)
                const Text('Could not load this word.',
                    style: TextStyle(fontSize: 18))
              else if (entry != null) ...[
                Row(
                  children: [
                    if (entry.pronunciation != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          border: Border.all(color: const Color(0xff9da3ad)),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(entry.pronunciation!,
                            style: const TextStyle(fontSize: 16)),
                      ),
                    const SizedBox(width: 12),
                    if (entry.translation != null)
                      Text(entry.translation!,
                          style: const TextStyle(fontSize: 26)),
                  ],
                ),
                if (entry.examples.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Text(entry.examples.first,
                      style: const TextStyle(
                          fontSize: 20, fontStyle: FontStyle.italic)),
                ],
                if (entry.partOfSpeech != null) ...[
                  const SizedBox(height: 22),
                  Text(entry.partOfSpeech!,
                      style: const TextStyle(
                          fontSize: 20, fontWeight: FontWeight.w800)),
                ],
                if (entry.definition != null) ...[
                  const SizedBox(height: 12),
                  Text('• ${entry.definition!}',
                      style: const TextStyle(fontSize: 20, height: 1.3)),
                ],
                if (entry.examples.length > 1) ...[
                  const SizedBox(height: 12),
                  ...entry.examples.skip(1).map(
                        (example) => Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(example,
                              style: const TextStyle(
                                  fontSize: 18,
                                  height: 1.3,
                                  color: Color(0xff666666),
                                  fontStyle: FontStyle.italic)),
                        ),
                      ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class ScoreScreen extends StatefulWidget {
  const ScoreScreen({required this.api, required this.messageId, super.key});

  final ApiClient api;
  final int messageId;

  @override
  State<ScoreScreen> createState() => _ScoreScreenState();
}

class _ScoreScreenState extends State<ScoreScreen> {
  late Future<PronunciationScore> score;

  @override
  void initState() {
    super.initState();
    score = widget.api.getScore(widget.messageId);
  }

  Color _barColor(int value) {
    if (value >= 75) return const Color(0xff5fbd51);
    if (value >= 50) return const Color(0xfff2c94c);
    return const Color(0xffeb5757);
  }

  Widget _metric(String label, int value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 22)),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            minHeight: 12,
            value: value.clamp(0, 100) / 100,
            backgroundColor: Colors.white,
            valueColor: AlwaysStoppedAnimation<Color>(_barColor(value)),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<PronunciationScore>(
      future: score,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Padding(
            padding: EdgeInsets.all(18),
            child: Panel(child: LinearProgressIndicator()),
          );
        }
        if (snapshot.hasError || snapshot.data == null) {
          return const EmptyPanel(
              text: 'Could not load pronunciation analysis.');
        }
        final data = snapshot.data!;
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Pronunciation Analysis',
                  style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800)),
              const SizedBox(height: 20),
              Panel(
                child: GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 18,
                  childAspectRatio: 3.2,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    _metric('Accuracy ⓘ', data.accuracyScore),
                    _metric('Fluency ⓘ', data.fluencyScore),
                    _metric('Prosody ⓘ', data.prosodyScore),
                    _metric('Grammar ⓘ', data.grammarScore),
                    _metric('Vocabulary ⓘ', data.vocabularyScore),
                    _metric('Topic ⓘ', data.topicScore),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              const Text('Transcript',
                  style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800)),
              const SizedBox(height: 14),
              Panel(
                child: Text(data.transcript,
                    style: const TextStyle(fontSize: 24, height: 1.35)),
              ),
              if (data.feedback != null && data.feedback!.isNotEmpty) ...[
                const SizedBox(height: 18),
                Panel(
                  child: Text(data.feedback!,
                      style: const TextStyle(fontSize: 18, height: 1.35)),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({required this.profile, super.key});

  final UserProfile profile;

  static const days = [
    27,
    28,
    29,
    30,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const SizedBox(height: 8),
          const CircleAvatar(
              radius: 56,
              backgroundColor: Color(0xfff0f4ff),
              child: Text('👩🏻', style: TextStyle(fontSize: 62))),
          const SizedBox(height: 10),
          Text(profile.name ?? 'Learner',
              style:
                  const TextStyle(fontSize: 30, fontWeight: FontWeight.w800)),
          const Text('⭐ 0',
              style: TextStyle(fontSize: 24, color: Color(0xff606975))),
          const SizedBox(height: 22),
          const WideButton(
              text: 'Invite Friends',
              color: Color(0xff358fe8),
              textColor: Colors.white),
          const SizedBox(height: 14),
          const WideButton(
              text: 'Share Profile',
              color: Color(0xffbedbf5),
              textColor: Color(0xff2f8be8)),
          const SizedBox(height: 20),
          Panel(
            child: Column(
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.local_fire_department,
                        color: Color(0xffff8317), size: 62),
                    Text(
                        '${profile.currentStreak == 0 ? 1 : profile.currentStreak}',
                        style: const TextStyle(
                            fontSize: 72, fontWeight: FontWeight.w800)),
                  ],
                ),
                const Text('days streak',
                    style: TextStyle(fontSize: 26, color: Color(0xff68717a))),
                const SizedBox(height: 24),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('‹', style: TextStyle(fontSize: 22)),
                    Text('May 2026', style: TextStyle(fontSize: 18)),
                    Text('›', style: TextStyle(fontSize: 22))
                  ],
                ),
                const SizedBox(height: 16),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: days.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 7, mainAxisExtent: 42),
                  itemBuilder: (context, index) {
                    final day = days[index];
                    final isWeekend = index % 7 == 5 || index % 7 == 6;
                    final isToday = day == 28;
                    final isOutlined = day == 27 && index > 20;
                    return Center(
                      child: Container(
                        width: 38,
                        height: 38,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isToday
                              ? const Color(0xff358fe8)
                              : Colors.transparent,
                          shape: BoxShape.circle,
                          border: isOutlined
                              ? Border.all(
                                  color: const Color(0xffff8317), width: 2)
                              : null,
                        ),
                        child: Text(
                          '$day',
                          style: TextStyle(
                              fontSize: 17,
                              color: isToday
                                  ? Colors.white
                                  : isWeekend
                                      ? Colors.red
                                      : Colors.black),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          Panel(
            child: GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              childAspectRatio: 2.4,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                StatTile(value: '${profile.wordCount}', label: 'Words Said'),
                StatTile(
                    value: '${profile.maximumStreak}', label: 'Max streak'),
                const StatTile(value: '0%', label: 'Correct'),
                StatTile(
                    value: '${profile.messagesCount}', label: 'Messages Sent'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SavedScreen extends StatefulWidget {
  const SavedScreen({required this.api, super.key});

  final ApiClient api;

  @override
  State<SavedScreen> createState() => _SavedScreenState();
}

class _SavedScreenState extends State<SavedScreen> {
  late Future<List<SavedWord>> words;

  @override
  void initState() {
    super.initState();
    words = widget.api.getSavedWords();
  }

  void _showSavedWord(SavedWord word) {
    final entry = WordDefinition(
      word: word.word,
      translation: word.translation,
      definition: word.definition,
      examples: word.examples,
      partOfSpeech: word.partOfSpeech,
      pronunciation: word.pronunciation,
      antonyms: word.antonyms,
      saved: true,
    );
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      enableDrag: false,
      isDismissible: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => WordDefinitionSheet(
        api: widget.api,
        word: word.word,
        snapshot: AsyncSnapshot.withData(ConnectionState.done, entry),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<SavedWord>>(
      future: words,
      builder: (context, snapshot) {
        final rows = snapshot.data ?? const <SavedWord>[];
        if (rows.isEmpty) {
          return const SingleChildScrollView(
            padding: EdgeInsets.all(18),
            child: Panel(
              child: Text(
                "You don't have any words saved yet! To save a word:\n1️⃣  Open transcription of a Chatty response\n2️⃣  Click on a word you want to save\n3️⃣  Click bookmark icon",
                style: TextStyle(fontSize: 24, height: 1.35),
              ),
            ),
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(18),
          itemCount: rows.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final word = rows[index];
            return GestureDetector(
              onTap: () => _showSavedWord(word),
              child: Panel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(word.word,
                        style: const TextStyle(
                            fontSize: 26, fontWeight: FontWeight.w800)),
                    if (word.translation != null)
                      Text(word.translation!,
                          style: const TextStyle(fontSize: 18)),
                    if (word.definition != null)
                      Text(word.definition!,
                          style: const TextStyle(color: Color(0xff68717a))),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class StarsScreen extends StatelessWidget {
  const StarsScreen({required this.profile, super.key});

  final UserProfile profile;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(18),
      child: Panel(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Chatty Unlimited',
                style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800)),
            const SizedBox(height: 18),
            const Text('✅ Unlimited messages and audio',
                style: TextStyle(fontSize: 20)),
            const Text('✅ You can unsubscribe at any time',
                style: TextStyle(fontSize: 20)),
            const Text('✅ Subscribers are more likely to improve their level',
                style: TextStyle(fontSize: 20)),
            const SizedBox(height: 22),
            const WideButton(
                text: 'Monthly subscription · \$9.99/month',
                color: Color(0xff358fe8),
                textColor: Colors.white),
            const SizedBox(height: 12),
            const WideButton(
                text: 'Yearly subscription · \$49.99/year',
                color: Color(0xff358fe8),
                textColor: Colors.white),
            const SizedBox(height: 16),
            Text('Status: ${profile.subscriptionStatus}',
                style: const TextStyle(color: Color(0xff68717a))),
          ],
        ),
      ),
    );
  }
}

class LanguageScreen extends StatelessWidget {
  const LanguageScreen(
      {required this.profile,
      required this.onChanged,
      required this.api,
      super.key});

  final UserProfile profile;
  final ValueChanged<UserProfile> onChanged;
  final ApiClient api;

  static const languages = [
    ('FR', 'French'),
    ('DE', 'German'),
    ('ES', 'Spanish'),
    ('JP', 'Japanese'),
    ('CN', 'Chinese'),
    ('IT', 'Italian'),
    ('KR', 'Korean'),
    ('PT', 'Portuguese'),
    ('RU', 'Russian'),
    ('KZ', 'Kazakh'),
    ('TR', 'Turkish'),
    ('UZ', 'Uzbek'),
    ('EN', 'English'),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: languages.length,
      itemBuilder: (context, index) {
        final item = languages[index];
        final selected = profile.nativeLanguage == item.$2;
        return LanguageRow(
          code: item.$1,
          language: item.$2,
          selected: selected,
          onTap: () async => onChanged(await api.updateLanguage(item.$2)),
        );
      },
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen(
      {required this.profile,
      required this.onChanged,
      required this.api,
      super.key});

  final UserProfile profile;
  final ValueChanged<UserProfile> onChanged;
  final ApiClient api;

  static const voices = ['Alex', 'Eric', 'Henry', 'James', 'Alexa', 'Emily'];
  static const levels = [
    'Beginner',
    'Elementary',
    'Pre-Intermediate',
    'Intermediate',
    'Upper-Intermediate',
    'Advanced',
    'Native'
  ];
  static const topics = [
    'Travel and Culture',
    'Food and Cooking',
    'Music and Art',
    'Sports and Fitness',
    'Technology and Social Media'
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        const SettingsRow(
            icon: Icons.favorite, label: 'Get unlimited access', muted: true),
        const SizedBox(height: 30),
        const SettingsRow(icon: Icons.group_add, label: 'Invite friends'),
        const SettingsRow(
            icon: Icons.card_giftcard, label: 'Gift subscription'),
        const SizedBox(height: 30),
        const SettingsRow(icon: Icons.groups, label: 'Change mode'),
        SettingsRow(
          icon: Icons.mic,
          label: 'Change Chatty voice · ${profile.selectedVoice}',
          onTap: () async {
            final index = voices.indexOf(profile.selectedVoice);
            onChanged(await api.updateVoice(
                voices[(index + 1) % voices.length], true));
          },
        ),
        SettingsRow(
          icon: Icons.bar_chart,
          label: 'Change your English level · ${profile.englishLevel}',
          onTap: () async {
            final index = levels.indexOf(profile.englishLevel);
            onChanged(
                await api.updateLevel(levels[(index + 1) % levels.length]));
          },
        ),
        SettingsRow(
            icon: Icons.speed,
            label: 'Change Chatty voice speed · ${profile.voiceSpeed}x'),
        const SettingsRow(icon: Icons.list, label: 'Choose topics'),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: topics.map((topic) {
            final selected = profile.selectedTopics.contains(topic);
            return ChoiceChip(
              label: Text(topic),
              selected: selected,
              onSelected: (_) async {
                final next = [...profile.selectedTopics];
                selected ? next.remove(topic) : next.add(topic);
                onChanged(await api.updateTopics(next));
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 30),
        const SettingsRow(icon: Icons.help, label: 'How to use Chatty'),
      ],
    );
  }
}

class Panel extends StatelessWidget {
  const Panel({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
          color: const Color(0xfff2f2f4),
          borderRadius: BorderRadius.circular(28)),
      child: child,
    );
  }
}

class WideButton extends StatelessWidget {
  const WideButton({
    required this.text,
    required this.color,
    required this.textColor,
    this.onPressed,
    super.key,
  });

  final String text;
  final Color color;
  final Color textColor;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 60,
      child: FilledButton(
        style: FilledButton.styleFrom(
            backgroundColor: color, foregroundColor: textColor),
        onPressed: onPressed ?? () {},
        child: Text(text,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
      ),
    );
  }
}

class StatTile extends StatelessWidget {
  const StatTile({required this.value, required this.label, super.key});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(value,
            style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w800)),
        Text(label,
            style: const TextStyle(fontSize: 22, color: Color(0xff68717a))),
      ],
    );
  }
}

class LanguageRow extends StatelessWidget {
  const LanguageRow(
      {required this.code,
      required this.language,
      required this.selected,
      required this.onTap,
      super.key});

  final String code;
  final String language;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      minTileHeight: 70,
      tileColor: selected ? const Color(0xffe5f1ff) : const Color(0xfff3f3f5),
      leading: const CircleAvatar(
          radius: 28,
          backgroundColor: Color(0xfff0f4ff),
          child: Text('👩🏻', style: TextStyle(fontSize: 30))),
      title: Row(
        children: [
          SizedBox(
              width: 34,
              child: Text(code,
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w800))),
          Expanded(
              child: Text(language,
                  style: const TextStyle(
                      fontSize: 22, fontWeight: FontWeight.w800))),
        ],
      ),
      trailing: const Icon(Icons.chevron_right, color: Color(0xffc7c7c7)),
      onTap: onTap,
    );
  }
}

class SettingsRow extends StatelessWidget {
  const SettingsRow(
      {required this.icon,
      required this.label,
      this.muted = false,
      this.onTap,
      super.key});

  final IconData icon;
  final String label;
  final bool muted;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      minTileHeight: 70,
      tileColor: const Color(0xfff3f3f5),
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
            color: muted ? const Color(0xffff2c62) : const Color(0xff1681f7),
            borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: Colors.white),
      ),
      title: Text(label,
          style: TextStyle(
              fontSize: 21, color: muted ? Colors.white : Colors.black)),
      trailing: const Icon(Icons.chevron_right, color: Color(0xffc7c7c7)),
      onTap: onTap,
    );
  }
}

class EmptyPanel extends StatelessWidget {
  const EmptyPanel({required this.text, super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(18),
      child: Panel(child: Text(text, style: const TextStyle(fontSize: 18))),
    );
  }
}
