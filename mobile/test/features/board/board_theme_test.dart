import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/features/board/presentation/board_theme.dart';

void main() {
  test('wood green and blue themes have distinct palettes', () {
    final wood = boardPaletteFor('wood');
    final green = boardPaletteFor('green');
    final blue = boardPaletteFor('blue');
    expect(wood.darkSquare, isNot(green.darkSquare));
    expect(green.darkSquare, isNot(blue.darkSquare));
    expect(blue.darkSquare, isNot(wood.darkSquare));
  });

  test('unknown theme safely falls back to wood', () {
    expect(boardPaletteFor('unknown'), boardPaletteFor('wood'));
  });
}
