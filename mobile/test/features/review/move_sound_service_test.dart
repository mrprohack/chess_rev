import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/data/models/game_analysis.dart';
import 'package:reviewchess/features/review/presentation/move_sound_service.dart';

GameMove move(String san) => GameMove(
      number: 1,
      color: 'white',
      notation: san,
      classification: 'Good',
      fen: '8/8/8/8/8/8/8/4K3 w - - 0 1',
    );

void main() {
  test('maps move categories deterministically', () {
    expect(soundKindForMove(move('e4')), MoveSoundKind.move);
    expect(soundKindForMove(move('Nxe5')), MoveSoundKind.capture);
    expect(soundKindForMove(move('Qh5+')), MoveSoundKind.check);
    expect(soundKindForMove(move('O-O')), MoveSoundKind.castle);
    expect(soundKindForMove(move('e8=Q')), MoveSoundKind.promotion);
    expect(soundKindForMove(move('Qh7#')), MoveSoundKind.gameEnd);
  });

  test('sound asset path respects selected theme', () {
    expect(
      soundAssetPath(move('Nxe5'), 'soft'),
      'assets/sounds/soft/capture.wav',
    );
    expect(
      soundAssetPath(move('e4'), 'minimal'),
      'assets/sounds/minimal/move.wav',
    );
    expect(
      soundAssetPath(move('e4'), 'unknown'),
      'assets/sounds/classic/move.wav',
    );
  });
}
