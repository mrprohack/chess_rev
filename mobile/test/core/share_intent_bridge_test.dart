import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/core/sharing/share_intent_bridge.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  const channel = MethodChannel('com.reviewchess.app/share');

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });

  test('opens native share sheet through platform channel', () async {
    MethodCall? captured;
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
          captured = call;
          return true;
        });

    final shared = await const ShareIntentBridge().shareText(
      'https://lichess.org/abcdefgh',
    );

    expect(shared, isTrue);
    expect(captured?.method, 'shareText');
    expect(captured?.arguments, {'text': 'https://lichess.org/abcdefgh'});
  });
}
