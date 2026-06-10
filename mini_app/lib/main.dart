import 'package:flutter/material.dart';

import 'api_client.dart';
import 'models.dart';

void main() {
  runApp(const ChattyMiniApp());
}

const companyInfoSections = [
  (
    'Contacts',
    'Contact details:\n- Phone and Telegram: +7 776 661 6110\n- Email: schoolskyling@gmail.com\n- Working hours: Monday to Friday, 10:00-19:00\n- Actual address: Kazakhstan, Karaganda\n- Service format: online'
  ),
  (
    'Pricing',
    'Monthly plan:\n- Price: 6,000 KZT per month\n- Online English conversation practice\n- Unlimited messages and audio with Aqbota\n- Mistake explanations, translations, and pronunciation evaluation\n- Saved vocabulary and learning progress tools\n\nThe service is provided online after successful payment.'
  ),
  (
    'Terms of Service',
    'Service conditions:\n- Services are provided online.\n- After successful payment, the user receives access automatically or within 24 hours.\n- Access is provided for the period specified in the selected tariff description.\n- To receive the service, the user must provide correct contact details: Telegram, email, or phone number.\n\nSupport:\n- Email: schoolskyling@gmail.com\n- Phone: +7 776 661 6110'
  ),
  (
    'Refund Policy',
    'Refund conditions:\n- The user may refuse the service before the service begins.\n- If the service has not yet been provided, the user may request a refund.\n- Refunds are made using the same payment method used for payment, within timeframes that depend on the bank and payment system.\n- If access to the digital service has already been provided and the user has started using the service, the refund may be limited by the actual volume of services already provided.\n\nTo request a refund, email schoolskyling@gmail.com and include:\n- Full name\n- Payment date\n- Payment amount\n- Reason for refund\n- Contact phone number or email'
  ),
  (
    'Company Details',
    'Business details:\n- Individual Entrepreneur Muratov\n- IIN: 060611551367\n- Address: Kazakhstan, Karaganda, Baiken Ashimova 21\n- Bank: JSC Kaspi Bank\n- KBe: 19\n- BIK: CASPKZKA\n- Account number: KZ59722S000051751772\n- Phone: +7 702 260 11 77\n- Email: ajbatmuratov2@gmail.com'
  ),
  (
    'Public Offer',
    'This public offer defines the conditions for using the online English learning service Aqbota.\n\nBy paying for a tariff or using the service, the user accepts these terms.\n\nThe provider gives the user access to:\n- Online educational tools\n- English practice\n- Automated corrections\n- Vocabulary features\n- Related learning materials\n\nThe user agrees to provide accurate contact information and use the service only for personal learning purposes. Current access terms are determined by the tariff selected and paid by the user.'
  ),
  (
    'Privacy Policy',
    'We collect and process only the information needed to provide the online learning service:\n- Telegram account data\n- Contact details provided by the user\n- Learning messages\n- Saved words\n- Progress data\n- Payment-related information\n- Technical data required for service operation\n\nThis information is used to provide access, support learning features, process payments, improve service quality, and contact the user about the service.\n\nWe do not sell personal data to third parties. The user may contact schoolskyling@gmail.com to request information about their data or ask for deletion where applicable.'
  ),
];

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
                    StarsScreen(api: api, profile: currentProfile),
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
    super.key,
  });

  final ApiClient api;
  final UserProfile profile;
  final int messageId;

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
                      onSubmitted: (_) => _sendFollowUp(),
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

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({required this.profile, super.key});

  final UserProfile profile;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  static const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  late DateTime visibleMonth;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    visibleMonth = DateTime(now.year, now.month);
  }

  List<DateTime?> get monthCells {
    final firstDay = DateTime(visibleMonth.year, visibleMonth.month);
    final daysInMonth =
        DateTime(visibleMonth.year, visibleMonth.month + 1, 0).day;
    return [
      ...List<DateTime?>.filled(firstDay.weekday - 1, null),
      for (var day = 1; day <= daysInMonth; day += 1)
        DateTime(visibleMonth.year, visibleMonth.month, day),
    ];
  }

  String dateKey(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }

  void moveMonth(int delta) {
    setState(() {
      visibleMonth = DateTime(visibleMonth.year, visibleMonth.month + delta);
    });
  }

  @override
  Widget build(BuildContext context) {
    final profile = widget.profile;
    final now = DateTime.now();
    final todayKey = dateKey(now);
    final activeDates = profile.activeDates.toSet();
    final title = '${_monthName(visibleMonth.month)} ${visibleMonth.year}';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const SizedBox(height: 8),
          const CircleAvatar(
              radius: 56,
              backgroundColor: Color(0xfff0f4ff),
              child: Text('CL',
                  style: TextStyle(fontSize: 38, fontWeight: FontWeight.w800))),
          const SizedBox(height: 10),
          Text(profile.name ?? 'Learner',
              style:
                  const TextStyle(fontSize: 30, fontWeight: FontWeight.w800)),
          const Text('Star 0',
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
                    Text('${profile.currentStreak}',
                        style: const TextStyle(
                            fontSize: 72, fontWeight: FontWeight.w800)),
                  ],
                ),
                const Text('days streak',
                    style: TextStyle(fontSize: 26, color: Color(0xff68717a))),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                        onPressed: () => moveMonth(-1),
                        icon: const Icon(Icons.chevron_left)),
                    Text(title, style: const TextStyle(fontSize: 18)),
                    IconButton(
                        onPressed: () => moveMonth(1),
                        icon: const Icon(Icons.chevron_right)),
                  ],
                ),
                const SizedBox(height: 8),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: weekdays.length + monthCells.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 7, mainAxisExtent: 42),
                  itemBuilder: (context, index) {
                    if (index < weekdays.length) {
                      return Center(
                        child: Text(weekdays[index],
                            style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xff7b838d),
                                fontWeight: FontWeight.w700)),
                      );
                    }
                    final cell = monthCells[index - weekdays.length];
                    if (cell == null) return const SizedBox.shrink();
                    final key = dateKey(cell);
                    final isWeekend = cell.weekday == DateTime.saturday ||
                        cell.weekday == DateTime.sunday;
                    final isToday = key == todayKey;
                    final isActive = activeDates.contains(key);
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
                          border: isActive
                              ? Border.all(
                                  color: const Color(0xffff8317), width: 2)
                              : null,
                        ),
                        child: Text(
                          '${cell.day}',
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
                StatTile(value: '${profile.correctPercent}%', label: 'Correct'),
                StatTile(
                    value: '${profile.messagesCount}', label: 'Messages Sent'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _monthName(int month) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1];
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

class StarsScreen extends StatefulWidget {
  const StarsScreen({required this.api, required this.profile, super.key});

  final ApiClient api;
  final UserProfile profile;

  @override
  State<StarsScreen> createState() => _StarsScreenState();
}

class _StarsScreenState extends State<StarsScreen> {
  late int stars = widget.profile.starsCount;
  late int tickets = widget.profile.ticketsCount;
  late int dailyStars = widget.profile.dailyMessageStarsCount;
  bool exchanging = false;
  String? exchangeError;

  Future<void> exchangeStars() async {
    if (exchanging || stars < 100) return;
    setState(() {
      exchanging = true;
      exchangeError = null;
    });
    try {
      final result = await widget.api.exchangeStars();
      setState(() {
        stars = result.starsCount;
        tickets = result.ticketsCount;
        dailyStars = result.dailyMessageStarsCount;
      });
    } catch (_) {
      setState(() => exchangeError = 'Could not exchange stars.');
    } finally {
      setState(() => exchanging = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(18),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.star, color: Color(0xffffb21c), size: 78),
              const SizedBox(width: 18),
              Text('$stars',
                  style: const TextStyle(
                      fontSize: 70, fontWeight: FontWeight.w500)),
            ],
          ),
          const SizedBox(height: 4),
          const Text('your stars',
              style: TextStyle(color: Color(0xff5e6975), fontSize: 24)),
          const SizedBox(height: 18),
          WideButton(
            text: 'Exchange 100 stars for 1 ticket',
            color: const Color(0xffacd2f6),
            textColor: const Color(0xff62a9f6),
            onPressed: stars >= 100 && !exchanging ? exchangeStars : null,
          ),
          if (exchangeError != null) ...[
            const SizedBox(height: 8),
            Text(exchangeError!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xffc62842))),
          ],
          const SizedBox(height: 18),
          const Text('Win an iPhone 17 this New Year 2026!',
              textAlign: TextAlign.center, style: TextStyle(fontSize: 22)),
          const SizedBox(height: 6),
          const Text('Get lottery tickets to enter.',
              textAlign: TextAlign.center, style: TextStyle(fontSize: 22)),
          const SizedBox(height: 6),
          const Text('Details: @ChattyEnglishBotChannel',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xff005aaa), fontSize: 22)),
          const SizedBox(height: 28),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xffa7aab0)),
            ),
            child: Text(
              tickets > 0
                  ? 'You have $tickets lottery ${tickets == 1 ? 'ticket' : 'tickets'}.'
                  : 'You do not have tickets yet, exchange stars to participate',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xff565a61), fontSize: 19),
            ),
          ),
          const SizedBox(height: 20),
          Panel(
            child: Column(
              children: [
                const Text('Daily stars',
                    style:
                        TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(
                    10,
                    (index) => Icon(Icons.star,
                        color: index < dailyStars
                            ? const Color(0xffffb21c)
                            : const Color(0xff858585),
                        size: 26),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Send 10 correct long messages to Chatty every day to maximize this reward!',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xff69717c), fontSize: 20),
                ),
              ],
            ),
          ),
        ],
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
        SettingsRow(
          icon: Icons.favorite,
          label: 'Get unlimited access',
          muted: true,
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const PlansScreen()),
          ),
        ),
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
        SettingsRow(
          icon: Icons.description,
          label: 'Company information',
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => const CompanyInfoScreen(),
            ),
          ),
        ),
      ],
    );
  }
}

class PlansScreen extends StatelessWidget {
  const PlansScreen({super.key});

  static const features = [
    'Unlimited messages and audio with Aqbota',
    'Explanations of mistakes, translations, and pronunciation evaluation',
    'More practice tools for faster English progress',
    'Cancel anytime',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Plans')),
      body: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          const Icon(Icons.favorite, color: Color(0xffff2c62), size: 116),
          const SizedBox(height: 14),
          const Text(
            'Aqbota Unlimited',
            textAlign: TextAlign.center,
            style: TextStyle(
                color: Color(0xff4f62ef),
                fontSize: 34,
                fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 22),
          ...features.map(
            (feature) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.check_circle_outline,
                      color: Color(0xff1598ed), size: 26),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(feature, style: const TextStyle(fontSize: 20)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xffeaf3ff),
              border: Border.all(color: const Color(0xff278cff), width: 1.5),
              borderRadius: BorderRadius.circular(34),
            ),
            child: const Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Unlimited Month',
                          style: TextStyle(
                              fontSize: 25, fontWeight: FontWeight.w800)),
                      SizedBox(height: 6),
                      Text('Monthly subscription',
                          style: TextStyle(
                              color: Color(0xff6b7280), fontSize: 17)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('6000 ₸',
                        style:
                            TextStyle(color: Color(0xff2f72f6), fontSize: 25)),
                    SizedBox(height: 6),
                    Text('per month',
                        style:
                            TextStyle(color: Color(0xff2f72f6), fontSize: 15)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const WideButton(
            text: 'Continue',
            color: Color(0xff4f62ef),
            textColor: Colors.white,
          ),
        ],
      ),
    );
  }
}

class CompanyInfoScreen extends StatefulWidget {
  const CompanyInfoScreen({super.key});

  @override
  State<CompanyInfoScreen> createState() => _CompanyInfoScreenState();
}

class _CompanyInfoScreenState extends State<CompanyInfoScreen> {
  String? openSection = companyInfoSections.first.$1;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Company information')),
      body: ListView.separated(
        padding: const EdgeInsets.all(18),
        itemCount: companyInfoSections.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final section = companyInfoSections[index];
          final open = openSection == section.$1;
          return Panel(
            child: InkWell(
              onTap: () =>
                  setState(() => openSection = open ? null : section.$1),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(section.$1,
                            style: const TextStyle(
                                fontSize: 20, fontWeight: FontWeight.w800)),
                      ),
                      Icon(open ? Icons.expand_less : Icons.expand_more),
                    ],
                  ),
                  if (open) ...[
                    const SizedBox(height: 12),
                    Text(section.$2,
                        style: const TextStyle(
                            color: Color(0xff68717a),
                            fontSize: 16,
                            height: 1.35)),
                  ],
                ],
              ),
            ),
          );
        },
      ),
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
