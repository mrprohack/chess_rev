import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/features/board/presentation/board_motion_controller.dart';

void main() {
  test('normal motion reaches settled through ordered phases', () async {
    final controller = BoardMotionController(stepDuration: Duration.zero);
    final phases = <BoardMotionPhase>[];
    controller.addListener(() => phases.add(controller.phase));
    await controller.play(reduceMotion: false);
    expect(
      phases,
      containsAllInOrder([
        BoardMotionPhase.moving,
        BoardMotionPhase.landing,
        BoardMotionPhase.verdict,
        BoardMotionPhase.settled,
      ]),
    );
  });

  test(
    'reduced motion settles immediately without decorative phases',
    () async {
      final controller = BoardMotionController(stepDuration: Duration.zero);
      final phases = <BoardMotionPhase>[];
      controller.addListener(() => phases.add(controller.phase));
      await controller.play(reduceMotion: true);
      expect(phases, [BoardMotionPhase.settled]);
    },
  );
}
