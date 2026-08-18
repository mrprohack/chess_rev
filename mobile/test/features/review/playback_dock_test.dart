import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/features/review/presentation/widgets/playback_dock.dart';

void main() {
  testWidgets('keeps seven 48dp playback actions visible', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: PlaybackDock(
            currentMove: 0,
            totalMoves: 10,
            keyMoments: 2,
            isPlaying: false,
            onShare: () {},
            onFirst: null,
            onPrevious: null,
            onPlayPause: () {},
            onNext: () {},
            onLast: () {},
            onFlip: () {},
          ),
        ),
      ),
    );
    for (final label in [
      'Share',
      'First',
      'Previous',
      'Play',
      'Next',
      'Last',
      'Flip',
    ]) {
      final finder = find.bySemanticsLabel(label);
      expect(finder, findsOneWidget);
      final size = tester.getSize(finder);
      expect(size.width, greaterThanOrEqualTo(48));
      expect(size.height, greaterThanOrEqualTo(48));
    }
  });
}
