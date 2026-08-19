import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/core/storage/local_cache.dart';
import 'package:reviewchess/data/models/game_analysis.dart';
import 'package:reviewchess/features/board/presentation/chess_board_view.dart';
import 'package:reviewchess/features/review/data/game_repository.dart';
import 'package:reviewchess/features/review/presentation/review_screen.dart';

import '../support/fixture_factory.dart';

class IntegrationGameRepository implements GameRepository {
  @override
  Future<GameAnalysis> analyzeGame(AnalyzeGameRequest request) async =>
      fixtureGameAnalysis();
}

void main() {
  testWidgets(
    'deep-link style initial URL loads review and playback advances',
    (tester) async {
      final cache = MemoryLocalCache();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            gameRepositoryProvider.overrideWithValue(
              IntegrationGameRepository(),
            ),
            localCacheProvider.overrideWithValue(cache),
          ],
          child: const MaterialApp(
            home: ReviewScreen(
              initialUrl: 'https://www.chess.com/game/170804338698',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(ChessBoardView), findsOneWidget);
      expect(find.text('Alpha'), findsWidgets);
      expect(find.bySemanticsLabel('Next'), findsOneWidget);

      await tester.tap(find.bySemanticsLabel('Next'));
      await tester.pumpAndSettle();
      expect(find.text('e4'), findsWidgets);

      await tester.tap(find.bySemanticsLabel('Flip'));
      await tester.pump();
      expect(find.byType(ChessBoardView), findsOneWidget);
      expect(await cache.readRecentUrls(), [
        'https://www.chess.com/game/170804338698',
      ]);
    },
  );
}
