import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/core/sharing/incoming_game_link_controller.dart';

void main() {
  test('forwards valid shared URL once per delivery token', () async {
    final handled = <String>[];
    final controller = IncomingGameLinkController(
      onGameUrl: (url) async => handled.add(url),
    );

    expect(
      await controller.handleSharedText(
        'Review https://lichess.org/abcdefgh',
        deliveryToken: 'same-intent',
      ),
      IncomingGameLinkResult.handled,
    );
    expect(
      await controller.handleSharedText(
        'Review https://lichess.org/abcdefgh',
        deliveryToken: 'same-intent',
      ),
      IncomingGameLinkResult.duplicate,
    );
    expect(handled, ['https://lichess.org/abcdefgh']);
  });

  test('rejects invalid share and handles custom URI', () async {
    final handled = <String>[];
    final controller = IncomingGameLinkController(
      onGameUrl: (url) async => handled.add(url),
    );
    expect(
      await controller.handleSharedText('hello'),
      IncomingGameLinkResult.invalid,
    );
    expect(
      await controller.handleUri(
        Uri.parse(
          'reviewchess://review?url=https%3A%2F%2Fwww.chess.com%2Fgame%2F170804338698',
        ),
      ),
      IncomingGameLinkResult.handled,
    );
    expect(handled.single, 'https://www.chess.com/game/170804338698');
  });
}
