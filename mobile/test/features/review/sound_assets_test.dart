import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('all themed move sounds contain non-silent PCM samples', () {
    const themes = ['classic', 'soft', 'minimal'];
    const sounds = ['move', 'capture', 'check', 'castle', 'promotion', 'game_end'];

    for (final theme in themes) {
      for (final sound in sounds) {
        final file = File('assets/sounds/$theme/$sound.wav');
        expect(file.existsSync(), isTrue, reason: file.path);
        final bytes = file.readAsBytesSync();
        expect(bytes.length, greaterThan(44), reason: file.path);
        expect(
          bytes.skip(44).any((byte) => byte != 0),
          isTrue,
          reason: '${file.path} must contain audible/non-zero PCM samples',
        );
      }
    }
  });
}
