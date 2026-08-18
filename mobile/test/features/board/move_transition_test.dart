import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/data/models/game_analysis.dart';
import 'package:reviewchess/features/board/domain/board_position.dart';
import 'package:reviewchess/features/board/domain/move_transition.dart';

GameMove move(String uci, String fen, {String notation = 'move'}) {
  return GameMove(
    number: 1,
    color: 'white',
    notation: notation,
    classification: 'Best',
    fen: fen,
    playedMove: uci,
  );
}

void main() {
  test('derives normal move and capture', () {
    final before = BoardPosition.fromFen(
      '8/8/8/8/8/8/4P3/4K3 w - - 0 1',
    );
    final after = BoardPosition.fromFen(
      '8/8/8/8/4P3/8/8/4K3 b - - 0 1',
    );
    final normal = deriveTransition(before, after, move('e2e4', afterFen(after)));
    expect(normal.type, MoveTransitionType.normal);
    expect(normal.source.algebraic, 'e2');
    expect(normal.destination.algebraic, 'e4');

    final captureBefore = BoardPosition.fromFen(
      '8/8/8/3p4/4P3/8/8/4K3 w - - 0 1',
    );
    final captureAfter = BoardPosition.fromFen(
      '8/8/8/3P4/8/8/8/4K3 b - - 0 1',
    );
    final capture = deriveTransition(
      captureBefore,
      captureAfter,
      move('e4d5', afterFen(captureAfter)),
    );
    expect(capture.type, MoveTransitionType.capture);
    expect(capture.capturedSquare?.algebraic, 'd5');
  });

  test('derives castling promotion and en passant', () {
    final castleBefore = BoardPosition.fromFen(
      '4k3/8/8/8/8/8/8/4K2R w K - 0 1',
    );
    final castleAfter = BoardPosition.fromFen(
      '4k3/8/8/8/8/8/8/5RK1 b - - 1 1',
    );
    expect(
      deriveTransition(castleBefore, castleAfter, move('e1g1', afterFen(castleAfter))).type,
      MoveTransitionType.castle,
    );

    final promotionBefore = BoardPosition.fromFen(
      '4k3/P7/8/8/8/8/8/4K3 w - - 0 1',
    );
    final promotionAfter = BoardPosition.fromFen(
      'Q3k3/8/8/8/8/8/8/4K3 b - - 0 1',
    );
    expect(
      deriveTransition(
        promotionBefore,
        promotionAfter,
        move('a7a8q', afterFen(promotionAfter)),
      ).type,
      MoveTransitionType.promotion,
    );

    final epBefore = BoardPosition.fromFen(
      '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',
    );
    final epAfter = BoardPosition.fromFen(
      '4k3/8/3P4/8/8/8/8/4K3 b - - 0 1',
    );
    final ep = deriveTransition(epBefore, epAfter, move('e5d6', afterFen(epAfter)));
    expect(ep.type, MoveTransitionType.enPassant);
    expect(ep.capturedSquare?.algebraic, 'd5');
  });

  test('missing UCI metadata uses direct jump', () {
    final board = BoardPosition.fromFen('8/8/8/8/8/8/8/4K3 w - - 0 1');
    final transition = deriveTransition(
      board,
      board,
      const GameMove(
        number: 1,
        color: 'white',
        notation: 'Kf1',
        classification: 'Good',
        fen: '8/8/8/8/8/8/8/4K3 w - - 0 1',
      ),
    );
    expect(transition.type, MoveTransitionType.directJump);
  });
}

String afterFen(BoardPosition _) => 'unused';
