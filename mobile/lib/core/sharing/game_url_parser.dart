const _lichessNonGameSegments = {
  'about',
  'analysis',
  'api',
  'blog',
  'broadcaster',
  'cam',
  'challenge',
  'coach',
  'community',
  'editor',
  'feed',
  'forum',
  'from',
  'games',
  'help',
  'mobile',
  'practice',
  'stream',
  'study',
  'swiss',
  'team',
  'top',
  'tournament',
  'training',
  'tv',
  'video',
  'white',
  'black',
};

bool _matchesProviderHost(String host, String root) {
  final normalized = host.toLowerCase();
  return normalized == root || normalized.endsWith('.$root');
}

bool isSupportedGameUri(Uri uri) {
  if (uri.scheme != 'https' && uri.scheme != 'http') return false;
  if (uri.host.isEmpty) return false;

  if (_matchesProviderHost(uri.host, 'lichess.org')) {
    final candidate = uri.pathSegments.where((segment) {
      final value = segment.toLowerCase();
      return value.isNotEmpty && !_lichessNonGameSegments.contains(value);
    });
    return candidate.isNotEmpty;
  }

  if (_matchesProviderHost(uri.host, 'chess.com')) {
    return uri.pathSegments.any(
      (segment) => RegExp(r'^\d{6,}$').hasMatch(segment),
    );
  }

  return false;
}

Uri? extractSupportedGameUri(String text) {
  final matches = RegExp(r'https?://[^\s]+').allMatches(text);
  for (final match in matches) {
    final matched = match.group(0);
    if (matched == null) continue;
    final cleaned = matched.replaceFirst(RegExp(r'[\]\[(){}>,.;!?]+$'), '');
    final uri = Uri.tryParse(cleaned);
    if (uri != null && isSupportedGameUri(uri)) return uri;
  }
  return null;
}
