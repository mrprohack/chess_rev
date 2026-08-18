import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';

import '../../data/models/chesscom_profile.dart';

abstract interface class LocalCache {
  Future<ChessComProfile?> readProfile();
  Future<void> writeProfile(ChessComProfile profile);
  Future<List<int>> readBookmarks(String gameUrl);
  Future<void> writeBookmarks(String gameUrl, Iterable<int> bookmarks);
  Future<List<String>> readRecentUrls();
  Future<void> addRecentUrl(String gameUrl);
  Future<String?> readLastOpenedUrl();
  Future<void> writeLastOpenedUrl(String gameUrl);
  Future<void> clearProfile();
  Future<void> clearBookmarks();
  Future<void> clearRecentUrls();
}

class MemoryLocalCache implements LocalCache {
  ChessComProfile? _profile;
  final Map<String, List<int>> _bookmarks = {};
  final List<String> _recentUrls = [];
  String? _lastOpenedUrl;

  @override
  Future<ChessComProfile?> readProfile() async => _profile;

  @override
  Future<void> writeProfile(ChessComProfile profile) async {
    _profile = profile;
  }

  @override
  Future<List<int>> readBookmarks(String gameUrl) async {
    return List<int>.unmodifiable(_bookmarks[_key(gameUrl)] ?? const []);
  }

  @override
  Future<void> writeBookmarks(String gameUrl, Iterable<int> bookmarks) async {
    final values = bookmarks.where((value) => value > 0).toSet().toList()
      ..sort();
    _bookmarks[_key(gameUrl)] = values;
  }

  @override
  Future<List<String>> readRecentUrls() async => List.unmodifiable(_recentUrls);

  @override
  Future<void> addRecentUrl(String gameUrl) async {
    final normalized = _key(gameUrl);
    _recentUrls.remove(normalized);
    _recentUrls.insert(0, normalized);
    if (_recentUrls.length > 20) {
      _recentUrls.removeRange(20, _recentUrls.length);
    }
    _lastOpenedUrl = normalized;
  }

  @override
  Future<String?> readLastOpenedUrl() async => _lastOpenedUrl;

  @override
  Future<void> writeLastOpenedUrl(String gameUrl) async {
    _lastOpenedUrl = _key(gameUrl);
  }

  @override
  Future<void> clearProfile() async => _profile = null;

  @override
  Future<void> clearBookmarks() async => _bookmarks.clear();

  @override
  Future<void> clearRecentUrls() async {
    _recentUrls.clear();
    _lastOpenedUrl = null;
  }
}

class HiveLocalCache implements LocalCache {
  HiveLocalCache(this.box);

  final Box<dynamic> box;

  static const _profileKey = 'profile';
  static const _recentKey = 'recentUrls';
  static const _lastUrlKey = 'lastOpenedUrl';
  static const _bookmarkPrefix = 'bookmarks:';

  @override
  Future<ChessComProfile?> readProfile() async {
    final raw = box.get(_profileKey);
    if (raw is! Map) return null;
    final map = raw.map((key, value) => MapEntry(key.toString(), value));
    return ChessComProfile.fromJson(map);
  }

  @override
  Future<void> writeProfile(ChessComProfile profile) {
    return box.put(_profileKey, profile.toJson());
  }

  @override
  Future<List<int>> readBookmarks(String gameUrl) async {
    final raw = box.get('$_bookmarkPrefix${_key(gameUrl)}');
    if (raw is! List) return const [];
    final values = raw.whereType<num>().map((value) => value.toInt()).toList()
      ..sort();
    return List.unmodifiable(values);
  }

  @override
  Future<void> writeBookmarks(String gameUrl, Iterable<int> bookmarks) {
    final values = bookmarks.where((value) => value > 0).toSet().toList()
      ..sort();
    return box.put('$_bookmarkPrefix${_key(gameUrl)}', values);
  }

  @override
  Future<List<String>> readRecentUrls() async {
    final raw = box.get(_recentKey);
    if (raw is! List) return const [];
    return raw.whereType<String>().toList(growable: false);
  }

  @override
  Future<void> addRecentUrl(String gameUrl) async {
    final normalized = _key(gameUrl);
    final urls = (await readRecentUrls()).toList();
    urls.remove(normalized);
    urls.insert(0, normalized);
    if (urls.length > 20) urls.removeRange(20, urls.length);
    await box.put(_recentKey, urls);
    await box.put(_lastUrlKey, normalized);
  }

  @override
  Future<String?> readLastOpenedUrl() async => box.get(_lastUrlKey) as String?;

  @override
  Future<void> writeLastOpenedUrl(String gameUrl) {
    return box.put(_lastUrlKey, _key(gameUrl));
  }

  @override
  Future<void> clearProfile() => box.delete(_profileKey);

  @override
  Future<void> clearBookmarks() async {
    final keys = box.keys.where(
      (key) => key.toString().startsWith(_bookmarkPrefix),
    );
    await box.deleteAll(keys);
  }

  @override
  Future<void> clearRecentUrls() async {
    await box.delete(_recentKey);
    await box.delete(_lastUrlKey);
  }
}

String _key(String rawUrl) {
  final uri = Uri.tryParse(rawUrl.trim());
  if (uri == null || uri.host.isEmpty) return rawUrl.trim();
  return uri
      .replace(
        scheme: uri.scheme.toLowerCase(),
        host: uri.host.toLowerCase(),
        query: null,
        fragment: null,
      )
      .toString();
}

final localCacheProvider = Provider<LocalCache>((ref) => MemoryLocalCache());
