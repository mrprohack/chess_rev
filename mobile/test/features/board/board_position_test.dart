import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/features/board/domain/board_position.dart';

void main() {
  test('parses starting FEN and side to move', () {
    final board = BoardPosition.fromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(board.pieceAt(BoardSquare.fromAlgebraic('a1'))?.type, PieceType.rook);
    expect(board.pieceAt(BoardSquare.fromAlgebraic('e8'))?.type, PieceType.king);
    expect(board.whiteToMove, isTrue);
    expect(board.pieces.length, 32);
  });

  test('rejects malformed ranks', () {
    expect(() => BoardPosition.fromFen('8/8/8/8/8/8/8 w - - 0 1'), throwsFormatException);
  });
}
