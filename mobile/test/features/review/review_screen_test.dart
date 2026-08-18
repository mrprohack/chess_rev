import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/core/storage/local_cache.dart';
import 'package:reviewchess/data/models/game_analysis.dart';
import 'package:reviewchess/features/board/presentation/chess_board_view.dart';
import 'package:reviewchess/features/review/data/game_repository.dart';
import 'package:reviewchess/features/review/presentation/review_screen.dart';

import '../../support/fixture_factory.dart';

class UiGameRepository implements GameRepository {
  @override
  Future<GameAnalysis> analyzeGame(AnalyzeGameRequest request) async => fixtureGameAnalysis();
}

void main() {
  testWidgets('empty state analyzes URL into full review tabs and board', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          gameRepositoryProvider.overrideWithValue(UiGameRepository()),
          localCacheProvider.overrideWithValue(MemoryLocalCache()),
        ],
        child: const MaterialApp(home: ReviewScreen()),
      ),
    );

    expect(find.text('Review a Game'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Analyze Game'), findsOneWidget);
    await tester.enterText(
      find.byType(TextField),
      'https://www.chess.com/game/170804338698',
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Analyze Game'));
    await tester.pumpAndSettle();

    expect(find.byType(ChessBoardView), findsOneWidget);
    expect(find.text('Alpha'), findsWidgets);
    expect(find.text('Beta'), findsWidgets);
    expect(find.text('Moves'), findsOneWidget);
    expect(find.text('Analysis'), findsOneWidget);
    expect(find.text('Opening'), findsOneWidget);
    expect(find.bySemanticsLabel('Play'), findsOneWidget);

    await tester.ensureVisible(find.text('Analysis'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Analysis'));
    await tester.pump();
    expect(find.textContaining('White Accuracy'), findsOneWidget);

    await tester.ensureVisible(find.text('Opening'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Opening'));
    await tester.pump();
    expect(find.text('Opening information unavailable'), findsOneWidget);
  });
}
