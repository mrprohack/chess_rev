import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/core/storage/local_cache.dart';
import 'package:reviewchess/data/models/app_settings.dart';
import 'package:reviewchess/data/models/game_analysis.dart';
import 'package:reviewchess/features/board/presentation/chess_board_view.dart';
import 'package:reviewchess/features/review/data/game_repository.dart';
import 'package:reviewchess/features/review/presentation/review_screen.dart';
import 'package:reviewchess/features/settings/presentation/settings_controller.dart';

class _ReviewSettingsRepository implements GameRepository {
  @override
  Future<GameAnalysis> analyzeGame(AnalyzeGameRequest request) async {
    return const GameAnalysis(
      white: 'Alpha',
      black: 'Beta',
      result: '1-0',
      counts: {
        'white': {'Best': 1},
        'black': {},
      },
      moves: [
        GameMove(
          number: 1,
          color: 'white',
          notation: 'Nf3',
          classification: 'Best',
          fen: 'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1',
          playedMove: 'g1f3',
          bestMove: 'g1f3',
        ),
      ],
    );
  }
}

Future<void> _loadReview(
  WidgetTester tester, {
  required AppSettings settings,
}) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        gameRepositoryProvider.overrideWithValue(_ReviewSettingsRepository()),
        localCacheProvider.overrideWithValue(MemoryLocalCache()),
        initialSettingsProvider.overrideWithValue(settings),
      ],
      child: const MaterialApp(home: ReviewScreen()),
    ),
  );
  await tester.enterText(
    find.byType(TextField),
    'https://lichess.org/abcdefgh',
  );
  await tester.tap(find.widgetWithText(FilledButton, 'Analyze Game'));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('review applies arrow and figurine notation settings', (
    tester,
  ) async {
    await _loadReview(
      tester,
      settings: AppSettings.defaults().copyWith(
        showArrows: false,
        figurineNotation: true,
      ),
    );

    final board = tester.widget<ChessBoardView>(find.byType(ChessBoardView));
    expect(board.showArrows, isFalse);
    expect(find.text('♘f3'), findsWidgets);
    expect(find.text('Nf3'), findsNothing);
  });

  testWidgets('Share playback action opens native Android share sheet', (
    tester,
  ) async {
    const channel = MethodChannel('com.reviewchess.app/share');
    String? sharedText;
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
          if (call.method == 'shareText') {
            final arguments = call.arguments as Map<Object?, Object?>;
            sharedText = arguments['text'] as String?;
            return true;
          }
          return null;
        });
    addTearDown(() {
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(channel, null);
    });

    await _loadReview(tester, settings: AppSettings.defaults());
    await tester.tap(find.bySemanticsLabel('Share'));
    await tester.pump();

    expect(sharedText, 'https://lichess.org/abcdefgh');
  });
}
