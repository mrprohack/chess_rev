import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/core/sharing/game_url_parser.dart';

void main() {
  test('accepts supported provider URLs and rejects deceptive hosts', () {
    expect(
      isSupportedGameUri(Uri.parse('https://www.chess.com/game/170804338698')),
      isTrue,
    );
    expect(
      isSupportedGameUri(Uri.parse('https://lichess.org/analysis/abcdefgh')),
      isTrue,
    );
    expect(
      isSupportedGameUri(
        Uri.parse('https://chess.com.attacker.example/game/170804338698'),
      ),
      isFalse,
    );
    expect(
      isSupportedGameUri(
        Uri.parse('https://lichess.org.attacker.example/abcdefgh'),
      ),
      isFalse,
    );
  });

  test('extracts the first supported URL from shared text', () {
    final uri = extractSupportedGameUri(
      'Review https://lichess.org/abcdefgh please',
    );
    expect(uri.toString(), 'https://lichess.org/abcdefgh');
  });
}
