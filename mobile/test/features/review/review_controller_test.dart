import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/core/storage/local_cache.dart';
import 'package:reviewchess/data/models/game_analysis.dart';
import 'package:reviewchess/features/review/data/game_repository.dart';
import 'package:reviewchess/features/review/presentation/review_controller.dart';

class FakeGameRepository implements GameRepository {
  FakeGameRepository(this.result, {this.gate});

  final GameAnalysis result;
  final Completer<void>? gate;
  int calls = 0;

  @override
  Future<GameAnalysis> analyzeGame(AnalyzeGameRequest request) async {
    calls += 1;
    if (gate != null) await gate!.future;
    return result;
  }
}

GameAnalysis fixtureGame() {
  final json = jsonDecode(File('test/fixtures/chesscom_analysis.json').readAsStringSync()) as Map<String, dynamic>;
  return GameAnalysis.fromJson(json);
}

ProviderContainer makeContainer(FakeGameRepository repository, MemoryLocalCache cache) {
  return ProviderContainer(overrides: [
    gameRepositoryProvider.overrideWithValue(repository),
    localCacheProvider.overrideWithValue(cache),
  ]);
}

void main() {
  test('analyzes supported URL and records lightweight history', () async {
    final repository = FakeGameRepository(fixtureGame());
    final cache = MemoryLocalCache();
    final container = makeContainer(repository, cache);
    addTearDown(container.dispose);

    await container.read(reviewControllerProvider.notifier).analyzeUrl('https://lichess.org/abcdefgh');

    final state = container.read(reviewControllerProvider);
    expect(state.game?.white, 'Alpha');
    expect(state.currentMoveIndex, 0);
    expect(repository.calls, 1);
    expect(await cache.readRecentUrls(), ['https://lichess.org/abcdefgh']);
  });

  test('prevents duplicate analysis while request is active', () async {
    final gate = Completer<void>();
    final repository = FakeGameRepository(fixtureGame(), gate: gate);
    final container = makeContainer(repository, MemoryLocalCache());
    addTearDown(container.dispose);
    final controller = container.read(reviewControllerProvider.notifier);

    final first = controller.analyzeUrl('https://lichess.org/abcdefgh');
    final second = controller.analyzeUrl('https://lichess.org/abcdefgh');
    expect(repository.calls, 1);
    gate.complete();
    await Future.wait([first, second]);
  });

  test('navigation clamps, flip toggles, and bookmarks persist', () async {
    final cache = MemoryLocalCache();
    final container = makeContainer(FakeGameRepository(fixtureGame()), cache);
    addTearDown(container.dispose);
    final controller = container.read(reviewControllerProvider.notifier);
    await controller.analyzeUrl('https://lichess.org/abcdefgh');

    controller.previousMove();
    expect(container.read(reviewControllerProvider).currentMoveIndex, 0);
    controller.lastMove();
    controller.nextMove();
    expect(container.read(reviewControllerProvider).currentMoveIndex, 2);
    controller.toggleFlip();
    expect(container.read(reviewControllerProvider).boardFlipped, isTrue);
    await controller.toggleBookmark(2);
    expect(await cache.readBookmarks('https://lichess.org/abcdefgh'), [2]);
  });
}
