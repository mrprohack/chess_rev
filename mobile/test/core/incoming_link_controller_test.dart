import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/core/sharing/incoming_link_controller.dart';

void main() {
  test('normalizes custom reviewchess deep link to provider URL', () {
    final incoming = IncomingGameLinkParser.parse(Uri.parse('reviewchess://review?url=https%3A%2F%2Flichess.org%2Fabcdefgh'));
    expect(incoming.toString(), 'https://lichess.org/abcdefgh');
  });

  test('rejects invalid shared text', () {
    expect(IncomingGameLinkParser.fromSharedText('hello world'), isNull);
  });
}
