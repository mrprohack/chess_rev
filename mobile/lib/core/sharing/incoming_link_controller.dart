import 'game_url_parser.dart';

abstract final class IncomingGameLinkParser {
  static Uri? fromSharedText(String text) => extractSupportedGameUri(text);

  static Uri? parse(Uri incoming) {
    if (isSupportedGameUri(incoming)) return incoming;

    if (incoming.scheme.toLowerCase() != 'reviewchess' ||
        incoming.host.toLowerCase() != 'review') {
      return null;
    }

    final encodedGameUrl = incoming.queryParameters['url'];
    if (encodedGameUrl == null || encodedGameUrl.trim().isEmpty) return null;
    final gameUri = Uri.tryParse(encodedGameUrl.trim());
    if (gameUri == null || !isSupportedGameUri(gameUri)) return null;
    return gameUri;
  }
}
