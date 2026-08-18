import 'package:flutter/foundation.dart';

enum BoardMotionPhase { idle, moving, landing, verdict, settled }

class BoardMotionController extends ChangeNotifier {
  BoardMotionController({this.stepDuration = const Duration(milliseconds: 90)});

  final Duration stepDuration;
  BoardMotionPhase phase = BoardMotionPhase.idle;
  int _token = 0;

  Future<void> play({required bool reduceMotion}) async {
    final token = ++_token;
    if (reduceMotion) {
      _setPhase(BoardMotionPhase.settled);
      return;
    }

    for (final next in const [
      BoardMotionPhase.moving,
      BoardMotionPhase.landing,
      BoardMotionPhase.verdict,
      BoardMotionPhase.settled,
    ]) {
      if (token != _token) return;
      _setPhase(next);
      if (next != BoardMotionPhase.settled) {
        await Future<void>.delayed(stepDuration);
      }
    }
  }

  void cancel() {
    _token += 1;
    _setPhase(BoardMotionPhase.settled);
  }

  void _setPhase(BoardMotionPhase next) {
    phase = next;
    notifyListeners();
  }
}
