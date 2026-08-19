import '../../../core/api/api_failure.dart';
import '../../../data/models/game_analysis.dart';

enum ReviewTab { moves, analysis, opening }

enum ReviewLoadingPhase { idle, validating, analyzing }

class ReviewState {
  const ReviewState({
    this.sourceUrl = '',
    this.game,
    this.currentMoveIndex = 0,
    this.previousMoveIndex = 0,
    this.boardFlipped = false,
    this.activeTab = ReviewTab.moves,
    this.autoplayRunning = false,
    this.loadingPhase = ReviewLoadingPhase.idle,
    this.error,
    this.bookmarks = const {},
  });

  final String sourceUrl;
  final GameAnalysis? game;
  final int currentMoveIndex;
  final int previousMoveIndex;
  final bool boardFlipped;
  final ReviewTab activeTab;
  final bool autoplayRunning;
  final ReviewLoadingPhase loadingPhase;
  final ApiFailure? error;
  final Set<int> bookmarks;

  bool get isLoading => loadingPhase != ReviewLoadingPhase.idle;

  ReviewState copyWith({
    String? sourceUrl,
    Object? game = _sentinel,
    int? currentMoveIndex,
    int? previousMoveIndex,
    bool? boardFlipped,
    ReviewTab? activeTab,
    bool? autoplayRunning,
    ReviewLoadingPhase? loadingPhase,
    Object? error = _sentinel,
    Set<int>? bookmarks,
  }) {
    return ReviewState(
      sourceUrl: sourceUrl ?? this.sourceUrl,
      game: identical(game, _sentinel) ? this.game : game as GameAnalysis?,
      currentMoveIndex: currentMoveIndex ?? this.currentMoveIndex,
      previousMoveIndex: previousMoveIndex ?? this.previousMoveIndex,
      boardFlipped: boardFlipped ?? this.boardFlipped,
      activeTab: activeTab ?? this.activeTab,
      autoplayRunning: autoplayRunning ?? this.autoplayRunning,
      loadingPhase: loadingPhase ?? this.loadingPhase,
      error: identical(error, _sentinel) ? this.error : error as ApiFailure?,
      bookmarks: bookmarks ?? this.bookmarks,
    );
  }
}

const _sentinel = Object();
