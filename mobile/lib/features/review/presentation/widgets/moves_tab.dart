import 'package:flutter/material.dart';

import '../../../../data/models/game_analysis.dart';
import '../../../board/presentation/classification_feedback.dart';
import '../review_notation.dart';

class MovesTab extends StatelessWidget {
  const MovesTab({
    required this.moves,
    required this.currentMoveIndex,
    required this.bookmarks,
    required this.onSelectMove,
    required this.onToggleBookmark,
    required this.figurineNotation,
    super.key,
  });

  final List<GameMove> moves;
  final int currentMoveIndex;
  final Set<int> bookmarks;
  final ValueChanged<int> onSelectMove;
  final ValueChanged<int> onToggleBookmark;
  final bool figurineNotation;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 12),
      itemCount: moves.length,
      itemBuilder: (context, index) {
        final moveIndex = index + 1;
        final move = moves[index];
        final selected = currentMoveIndex == moveIndex;
        return Material(
          color: selected
              ? Theme.of(
                  context,
                ).colorScheme.primaryContainer.withValues(alpha: 0.45)
              : Colors.transparent,
          child: ListTile(
            dense: true,
            selected: selected,
            onTap: () => onSelectMove(moveIndex),
            onLongPress: () => onToggleBookmark(moveIndex),
            leading: SizedBox(
              width: 36,
              child: Text(
                move.color == 'white' ? '${move.number}.' : '${move.number}…',
              ),
            ),
            title: Text(
              displaySan(move.notation, figurineNotation: figurineNotation),
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            subtitle: move.time == null ? null : Text(move.time!),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (bookmarks.contains(moveIndex))
                  const Padding(
                    padding: EdgeInsets.only(right: 6),
                    child: Icon(Icons.bookmark, size: 16),
                  ),
                ClassificationFeedback(
                  classification: move.classification,
                  compact: true,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
