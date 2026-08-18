import 'incoming_link_controller.dart';

enum IncomingGameLinkResult { handled, invalid, duplicate }

class IncomingGameLinkController {
  IncomingGameLinkController({required this.onGameUrl});

  final Future<void> Function(String url) onGameUrl;
  final Set<String> _deliveryTokens = {};

  Future<IncomingGameLinkResult> handleSharedText(
    String text, {
    String? deliveryToken,
  }) async {
    if (deliveryToken != null && !_deliveryTokens.add(deliveryToken)) {
      return IncomingGameLinkResult.duplicate;
    }
    final uri = IncomingGameLinkParser.fromSharedText(text);
    if (uri == null) return IncomingGameLinkResult.invalid;
    await onGameUrl(uri.toString());
    return IncomingGameLinkResult.handled;
  }

  Future<IncomingGameLinkResult> handleUri(Uri incoming) async {
    final uri = IncomingGameLinkParser.parse(incoming);
    if (uri == null) return IncomingGameLinkResult.invalid;
    await onGameUrl(uri.toString());
    return IncomingGameLinkResult.handled;
  }
}
