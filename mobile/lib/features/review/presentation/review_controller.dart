import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_failure.dart';
import '../../../core/sharing/game_url_parser.dart';
import '../../../core/storage/local_cache.dart';
import '../../settings/presentation/settings_controller.dart';
import '../data/game_repository.dart';
import 'review_state.dart';

final reviewControllerProvider =
    NotifierProvider<ReviewController, ReviewState>(ReviewController.new);

class ReviewController extends Notifier<ReviewState> {
  Timer? _autoplayTimer;

  @override
  ReviewState build() {
    ref.onDispose(() => _autoplayTimer?.cancel());
    return const ReviewState();
  }

  Future<void> analyzeUrl(String rawUrl) async {
    if (state.isLoading) return;
    final uri = Uri.tryParse(rawUrl.trim());
    stopAutoplay();
    state = state.copyWith(
      loadingPhase: ReviewLoadingPhase.validating,
      error: null,
      autoplayRunning: false,
    );

    if (uri == null || !isSupportedGameUri(uri)) {
      state = state.copyWith(
        loadingPhase: ReviewLoadingPhase.idle,
        error: const InvalidGameUrlFailure(),
      );
      return;
    }

    final normalizedUrl = uri.toString();
    final settings = ref.read(settingsProvider);
    state = state.copyWith(
      sourceUrl: normalizedUrl,
      loadingPhase: ReviewLoadingPhase.analyzing,
      error: null,
    );

    try {
      final game = await ref
          .read(gameRepositoryProvider)
          .analyzeGame(
            AnalyzeGameRequest(
              url: normalizedUrl,
              depth: settings.engineDepth,
              engine: settings.engine,
              maxTime: settings.maxTime,
              numLines: settings.numLines,
              threads: settings.threads,
            ),
          );
      final cache = ref.read(localCacheProvider);
      final bookmarks = await cache.readBookmarks(normalizedUrl);
      await cache.addRecentUrl(normalizedUrl);
      state = state.copyWith(
        game: game,
        currentMoveIndex: 0,
        previousMoveIndex: 0,
        loadingPhase: ReviewLoadingPhase.idle,
        bookmarks: Set.unmodifiable(bookmarks),
        error: null,
      );
    } on ApiFailure catch (failure) {
      state = state.copyWith(
        loadingPhase: ReviewLoadingPhase.idle,
        error: failure,
      );
    } catch (_) {
      state = state.copyWith(
        loadingPhase: ReviewLoadingPhase.idle,
        error: const UnknownFailure(),
      );
    }
  }

  void firstMove() => _selectMove(0);
  void previousMove() => _selectMove(state.currentMoveIndex - 1);
  void nextMove() => _selectMove(state.currentMoveIndex + 1);
  void lastMove() => _selectMove(state.game?.moves.length ?? 0);
  void selectMove(int index) => _selectMove(index);

  void _selectMove(int requestedIndex) {
    final max = state.game?.moves.length ?? 0;
    final next = requestedIndex.clamp(0, max);
    if (next == state.currentMoveIndex) return;
    state = state.copyWith(
      previousMoveIndex: state.currentMoveIndex,
      currentMoveIndex: next,
    );
  }

  void toggleFlip() {
    state = state.copyWith(boardFlipped: !state.boardFlipped);
  }

  void setTab(ReviewTab tab) {
    state = state.copyWith(activeTab: tab);
  }

  Future<void> toggleBookmark([int? moveIndex]) async {
    final sourceUrl = state.sourceUrl;
    final index = moveIndex ?? state.currentMoveIndex;
    if (sourceUrl.isEmpty || index < 1) return;
    final next = {...state.bookmarks};
    if (!next.add(index)) next.remove(index);
    state = state.copyWith(bookmarks: Set.unmodifiable(next));
    await ref.read(localCacheProvider).writeBookmarks(sourceUrl, next);
  }

  void toggleAutoplay() {
    if (state.autoplayRunning) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  }

  void startAutoplay() {
    final game = state.game;
    if (game == null || state.currentMoveIndex >= game.moves.length) return;
    _autoplayTimer?.cancel();
    state = state.copyWith(autoplayRunning: true);
    final speed = ref.read(settingsProvider).autoPlaySpeedMs;
    _autoplayTimer = Timer.periodic(Duration(milliseconds: speed), (timer) {
      final max = state.game?.moves.length ?? 0;
      if (state.currentMoveIndex >= max) {
        stopAutoplay();
        return;
      }
      _selectMove(state.currentMoveIndex + 1);
      if (state.currentMoveIndex >= max) stopAutoplay();
    });
  }

  void stopAutoplay() {
    _autoplayTimer?.cancel();
    _autoplayTimer = null;
    if (state.autoplayRunning) {
      state = state.copyWith(autoplayRunning: false);
    }
  }

  void reset() {
    stopAutoplay();
    state = const ReviewState();
  }
}
