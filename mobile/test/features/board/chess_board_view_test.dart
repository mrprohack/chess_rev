import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:reviewchess/data/models/game_analysis.dart';
import 'package:reviewchess/features/board/domain/board_position.dart';
import 'package:reviewchess/features/board/presentation/chess_board_view.dart';

void main() {
  final start = BoardPosition.fromFen(
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  );

  testWidgets('renders 32 local SVG pieces and flips board orientation', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: SizedBox(
              width: 320,
              child: ChessBoardView(position: start, showCoordinates: true),
            ),
          ),
        ),
      ),
    );
    expect(find.byType(SvgPicture), findsNWidgets(32));
    final normalA1 = tester.getCenter(find.byKey(const Key('square-a1')));
    final normalH8 = tester.getCenter(find.byKey(const Key('square-h8')));
    expect(normalA1.dy, greaterThan(normalH8.dy));

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: SizedBox(
              width: 320,
              child: ChessBoardView(
                position: start,
                flipped: true,
                showCoordinates: true,
              ),
            ),
          ),
        ),
      ),
    );
    final flippedA1 = tester.getCenter(find.byKey(const Key('square-a1')));
    final flippedH8 = tester.getCenter(find.byKey(const Key('square-h8')));
    expect(flippedA1.dy, lessThan(flippedH8.dy));
  });

  testWidgets('shows best-move arrow only when enabled', (tester) async {
    const move = GameMove(
      number: 1,
      color: 'white',
      notation: 'e4',
      classification: 'Book',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      bestMove: 'e2e4',
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 320,
            child: ChessBoardView(
              position: start,
              move: move,
              showArrows: true,
            ),
          ),
        ),
      ),
    );
    expect(find.byKey(const Key('best-move-arrow')), findsOneWidget);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 320,
            child: ChessBoardView(
              position: start,
              move: move,
              showArrows: false,
            ),
          ),
        ),
      ),
    );
    expect(find.byKey(const Key('best-move-arrow')), findsNothing);
  });
}
