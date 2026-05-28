import 'dart:convert';
import 'dart:html' as html;
import 'dart:js_util' as js_util;

import 'package:http/http.dart' as http;

import 'models.dart';

class ApiClient {
  ApiClient() : baseUrl = const String.fromEnvironment('API_BASE_URL', defaultValue: '');

  final String baseUrl;

  int get telegramUserId {
    final webAppId = _telegramWebAppUserId();
    if (webAppId != null) return webAppId;

    final queryId = Uri.base.queryParameters['telegram_user_id'];
    if (queryId != null) return int.tryParse(queryId) ?? 1;

    final telegram = html.window.localStorage['telegram_user_id'];
    if (telegram != null) return int.tryParse(telegram) ?? 1;

    return 1;
  }

  int? _telegramWebAppUserId() {
    try {
      final telegram = js_util.getProperty<Object?>(html.window, 'Telegram');
      if (telegram == null) return null;
      final webApp = js_util.getProperty<Object?>(telegram, 'WebApp');
      if (webApp == null) return null;
      final initDataUnsafe = js_util.getProperty<Object?>(webApp, 'initDataUnsafe');
      if (initDataUnsafe == null) return null;
      final user = js_util.getProperty<Object?>(initDataUnsafe, 'user');
      if (user == null) return null;
      final id = js_util.getProperty<Object?>(user, 'id');
      return int.tryParse(id.toString());
    } catch (_) {
      return null;
    }
  }

  Uri _uri(String path) {
    final uri = Uri.parse('$baseUrl$path');
    return uri.replace(
      queryParameters: {
        ...uri.queryParameters,
        'telegram_user_id': telegramUserId.toString(),
      },
    );
  }

  Future<UserProfile> getProfile() async {
    final response = await http.get(_uri('/api/profile'));
    _throwIfBad(response);
    return UserProfile.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<List<SavedWord>> getSavedWords() async {
    final response = await http.get(_uri('/api/learning/saved-words'));
    _throwIfBad(response);
    final rows = jsonDecode(response.body) as List;
    return rows.map((row) => SavedWord.fromJson(row as Map<String, dynamic>)).toList();
  }

  Future<UserProfile> updateLanguage(String language) {
    return _patchProfile('/api/profile/language', {'native_language': language});
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

  Future<UserProfile> _patchProfile(String path, Map<String, dynamic> body) async {
    final response = await http.patch(
      _uri(path),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    _throwIfBad(response);
    return UserProfile.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  void _throwIfBad(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(response.body);
    }
  }
}
