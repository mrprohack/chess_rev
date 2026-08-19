import 'package:flutter/material.dart';

import '../../../../data/models/game_analysis.dart';
import '../../../board/presentation/classification_feedback.dart';
import '../review_notation.dart';

class MoveStoryCard extends StatelessWidget {
  const MoveStoryCard({
    required this.move,
    required this.bookmarked,
    required this.onToggleBookmark,
    required this.figurineNotation,
    super.key,
  });

  final GameMove move;
  final bool bookmarked;
  final VoidCallback onToggleBookmark;
  final bool figurineNotation;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.fromLTRB(0, 8, 0, 6),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            ClassificationFeedback(classification: move.classification),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    displaySan(
                      move.notation,
                      figurineNotation: figurineNotation,
                    ),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  if (move.evaluation != null)
                    Text('Evaluation ${move.evaluation!.toStringAsFixed(2)}'),
                ],
              ),
            ),
            IconButton(
              onPressed: onToggleBookmark,
              tooltip: bookmarked ? 'Remove bookmark' : 'Bookmark move',
              icon: Icon(bookmarked ? Icons.bookmark : Icons.bookmark_border),
            ),
          ],
        ),
      ),
    );
  }
}
