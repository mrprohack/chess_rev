import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/sharing/share_intent_bridge.dart';
import '../../board/domain/board_position.dart';
import '../../board/presentation/chess_board_view.dart';
import '../../settings/presentation/settings_controller.dart';
import 'move_sound_service.dart';
import 'review_controller.dart';
import 'review_state.dart';
import 'widgets/analysis_tab.dart';
import 'widgets/evaluation_bar.dart';
import 'widgets/move_story_card.dart';
import 'widgets/moves_tab.dart';
import 'widgets/opening_tab.dart';
import 'widgets/playback_dock.dart';
import 'widgets/player_bar.dart';
import 'widgets/review_empty_state.dart';

const _startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

class ReviewScreen extends ConsumerStatefulWidget {
  const ReviewScreen({this.initialUrl, super.key});

  final String? initialUrl;

  @override
  ConsumerState<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends ConsumerState<ReviewScreen> {
  late final TextEditingController _urlController;

  @override
  void initState() {
    super.initState();
    _urlController = TextEditingController(text: widget.initialUrl ?? '');
    if ((widget.initialUrl ?? '').isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref
            .read(reviewControllerProvider.notifier)
            .analyzeUrl(widget.initialUrl!);
      });
    }
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(reviewControllerProvider);
    final controller = ref.read(reviewControllerProvider.notifier);

    ref.listen<int>(
      reviewControllerProvider.select((value) => value.currentMoveIndex),
      (previous, next) {
        if (next < 1 || previous == next) return;
        final review = ref.read(reviewControllerProvider);
        final game = review.game;
        if (game == null || next > game.moves.length) return;
        ref
            .read(moveSoundPlayerProvider)
            .play(game.moves[next - 1], ref.read(settingsProvider));
      },
    );

    if (state.game == null) {
      return SafeArea(
        child: Column(
          children: [
            if (state.error != null)
              MaterialBanner(
                content: Text(state.error!.message),
                actions: [
                  TextButton(
                    onPressed: () => controller.analyzeUrl(_urlController.text),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            Expanded(
              child: ReviewEmptyState(
                controller: _urlController,
                loading: state.isLoading,
                onAnalyze: () => controller.analyzeUrl(_urlController.text),
                onHistory: () {
                  try {
                    context.go('/history');
                  } catch (_) {}
                },
              ),
            ),
          ],
        ),
      );
    }

    final game = state.game!;
    final currentMove = state.currentMoveIndex > 0
        ? game.moves[state.currentMoveIndex - 1]
        : null;
    final currentPosition = BoardPosition.fromFen(
      currentMove?.fen ?? _startingFen,
    );
    BoardPosition? previousPosition;
    if (state.currentMoveIndex == state.previousMoveIndex + 1) {
      final previousFen = state.previousMoveIndex == 0
          ? _startingFen
          : game.moves[state.previousMoveIndex - 1].fen;
      previousPosition = BoardPosition.fromFen(previousFen);
    }
    final settings = ref.watch(settingsProvider);
    final keyMoments =
        game.moves.where(_isKeyMoment).length + state.bookmarks.length;

    return SafeArea(
      child: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
              child: Column(
                children: [
                  PlayerBar(
                    name: game.black,
                    rating: game.blackRating,
                    accuracy: game.accuracy?.black,
                    isTop: true,
                  ),
                  Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 520),
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          const evaluationWidth = 8.0;
                          const gap = 5.0;
                          final boardSize =
                              constraints.maxWidth - evaluationWidth - gap;
                          return SizedBox(
                            height: boardSize,
                            child: GestureDetector(
                              onHorizontalDragEnd: (details) {
                                final velocity = details.primaryVelocity ?? 0;
                                if (velocity < -250) controller.nextMove();
                                if (velocity > 250) controller.previousMove();
                              },
                              child: Row(
                                children: [
                                  SizedBox.square(
                                    dimension: boardSize,
                                    child: ChessBoardView(
                                      position: currentPosition,
                                      previousPosition: previousPosition,
                                      move: currentMove,
                                      flipped: state.boardFlipped,
                                      showCoordinates: settings.showCoordinates,
                                      showArrows: settings.showArrows,
                                      reduceMotion: settings.reduceMotion,
                                      boardTheme: settings.boardTheme,
                                    ),
                                  ),
                                  const SizedBox(width: gap),
                                  SizedBox(
                                    width: evaluationWidth,
                                    height: boardSize,
                                    child: EvaluationBar(
                                      evaluation: currentMove?.evaluation,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  PlayerBar(
                    name: game.white,
                    rating: game.whiteRating,
                    accuracy: game.accuracy?.white,
                  ),
                  if (currentMove != null)
                    MoveStoryCard(
                      move: currentMove,
                      bookmarked: state.bookmarks.contains(
                        state.currentMoveIndex,
                      ),
                      figurineNotation: settings.figurineNotation,
                      onToggleBookmark: controller.toggleBookmark,
                    ),
                  SegmentedButton<ReviewTab>(
                    segments: const [
                      ButtonSegment(
                        value: ReviewTab.moves,
                        label: Text('Moves'),
                      ),
                      ButtonSegment(
                        value: ReviewTab.analysis,
                        label: Text('Analysis'),
                      ),
                      ButtonSegment(
                        value: ReviewTab.opening,
                        label: Text('Opening'),
                      ),
                    ],
                    selected: {state.activeTab},
                    onSelectionChanged: (selection) =>
                        controller.setTab(selection.first),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 250,
                    child: switch (state.activeTab) {
                      ReviewTab.moves => MovesTab(
                        moves: game.moves,
                        currentMoveIndex: state.currentMoveIndex,
                        bookmarks: state.bookmarks,
                        figurineNotation: settings.figurineNotation,
                        onSelectMove: controller.selectMove,
                        onToggleBookmark: controller.toggleBookmark,
                      ),
                      ReviewTab.analysis => AnalysisTab(game: game),
                      ReviewTab.opening => const OpeningTab(),
                    },
                  ),
                ],
              ),
            ),
          ),
          PlaybackDock(
            currentMove: state.currentMoveIndex,
            totalMoves: game.moves.length,
            keyMoments: keyMoments,
            isPlaying: state.autoplayRunning,
            onShare: () async {
              final shared = await const ShareIntentBridge().shareText(
                state.sourceUrl,
              );
              if (!shared) {
                await Clipboard.setData(ClipboardData(text: state.sourceUrl));
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Game link copied to clipboard'),
                    ),
                  );
                }
              }
            },
            onFirst: state.currentMoveIndex == 0 ? null : controller.firstMove,
            onPrevious: state.currentMoveIndex == 0
                ? null
                : controller.previousMove,
            onPlayPause: controller.toggleAutoplay,
            onNext: state.currentMoveIndex >= game.moves.length
                ? null
                : controller.nextMove,
            onLast: state.currentMoveIndex >= game.moves.length
                ? null
                : controller.lastMove,
            onFlip: controller.toggleFlip,
          ),
        ],
      ),
    );
  }
}

bool _isKeyMoment(dynamic move) {
  final value = move.classification.toString().toLowerCase();
  return const {
    'brilliant',
    'great',
    'mistake',
    'miss',
    'blunder',
  }.contains(value);
}
