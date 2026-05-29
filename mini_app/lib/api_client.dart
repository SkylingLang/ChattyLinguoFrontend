import 'dart:convert';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';

import 'package:http/http.dart' as http;

import 'models.dart';

class ApiClient {
  ApiClient()
      : baseUrl =
            const String.fromEnvironment('API_BASE_URL', defaultValue: '');

  final String baseUrl;

  String get telegramInitData {
    try {
      final telegram = globalContext.getProperty<JSObject?>('Telegram'.toJS);
      final webApp = telegram?.getProperty<JSObject?>('WebApp'.toJS);
      final initData = webApp?.getProperty<JSString?>('initData'.toJS);
      return initData?.toDart ?? '';
    } catch (_) {
      return '';
    }
  }

  int get telegramUserId {
    final queryId = Uri.base.queryParameters['telegram_user_id'];
    if (queryId != null) return int.tryParse(queryId) ?? 1;

    return 1;
  }

  Uri _uri(String path) {
    final uri = Uri.parse('$baseUrl$path');
    final initData = telegramInitData;
    if (initData.isNotEmpty) return uri;

    return uri.replace(
      queryParameters: {
        ...uri.queryParameters,
        'telegram_user_id': telegramUserId.toString(),
      },
    );
  }

  Map<String, String> get _headers {
    final initData = telegramInitData;
    return {
      if (initData.isNotEmpty) 'X-Telegram-Init-Data': initData,
    };
  }

  Future<UserProfile> getProfile() async {
    final response = await http.get(_uri('/api/profile'), headers: _headers);
    _throwIfBad(response);
    return UserProfile.fromJson(
        jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<List<SavedWord>> getSavedWords() async {
    final response =
        await http.get(_uri('/api/learning/saved-words'), headers: _headers);
    _throwIfBad(response);
    final rows = jsonDecode(response.body) as List;
    return rows
        .map((row) => SavedWord.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  Future<ChatMessage> getMessage(int messageId) async {
    final response = await http.get(_uri('/api/learning/messages/$messageId'),
        headers: _headers);
    _throwIfBad(response);
    return ChatMessage.fromJson(
        jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<WordDefinition> defineWord(String word) async {
    final response = await http.get(
        _uri('/api/learning/word/${Uri.encodeComponent(word)}'),
        headers: _headers);
    _throwIfBad(response);
    return WordDefinition.fromJson(
        jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<PronunciationScore> getScore(int messageId) async {
    final response = await http.get(
        _uri('/api/learning/messages/$messageId/score'),
        headers: _headers);
    _throwIfBad(response);
    return PronunciationScore.fromJson(
        jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<UserProfile> updateLanguage(String language) {
    return _patchProfile(
        '/api/profile/language', {'native_language': language});
  }

  Future<UserProfile> updateLevel(String level) {
    return _patchProfile('/api/profile/level', {'english_level': level});
  }

  Future<UserProfile> updateVoice(String voice, bool enabled) {
    return _patchProfile('/api/profile/voice', {
      'selected_voice': voice,
      'voice_enabled': enabled,
    });
  }

  Future<UserProfile> updateTopics(List<String> topics) {
    return _patchProfile('/api/profile/topics', {'selected_topics': topics});
  }

  Future<UserProfile> _patchProfile(
      String path, Map<String, dynamic> body) async {
    final response = await http.patch(
      _uri(path),
      headers: {'Content-Type': 'application/json', ..._headers},
      body: jsonEncode(body),
    );
    _throwIfBad(response);
    return UserProfile.fromJson(
        jsonDecode(response.body) as Map<String, dynamic>);
  }

  void _throwIfBad(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(response.body);
    }
  }
}
