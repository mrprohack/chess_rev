import 'package:flutter/material.dart';

class ClassificationFeedback extends StatelessWidget {
  const ClassificationFeedback({
    required this.classification,
    this.compact = false,
    super.key,
  });

  final String classification;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final normalized = classification.toLowerCase();
    final scheme = Theme.of(context).colorScheme;
    final color = switch (normalized) {
      'brilliant' => const Color(0xFF26C6DA),
      'great' => const Color(0xFF42A5F5),
      'best' => const Color(0xFF81B64C),
      'inaccuracy' => const Color(0xFFFFB74D),
      'mistake' => const Color(0xFFFF9800),
      'miss' => const Color(0xFFEF6C00),
      'blunder' => const Color(0xFFEF5350),
      'book' => const Color(0xFF9C7A5A),
      _ => scheme.secondary,
    };
    return Semantics(
      label: 'Move classification: $classification',
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: compact ? 7 : 10,
          vertical: compact ? 3 : 5,
        ),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.18),
          border: Border.all(color: color.withValues(alpha: 0.7)),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          classification,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.w700,
            fontSize: compact ? 11 : 13,
          ),
        ),
      ),
    );
  }
}
