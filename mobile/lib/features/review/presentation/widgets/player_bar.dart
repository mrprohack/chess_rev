import 'package:flutter/material.dart';

class PlayerBar extends StatelessWidget {
  const PlayerBar({
    required this.name,
    this.rating,
    this.accuracy,
    this.isTop = false,
    super.key,
  });

  final String name;
  final String? rating;
  final double? accuracy;
  final bool isTop;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 7),
      child: Row(
        children: [
          CircleAvatar(
            radius: 15,
            backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
            child: Text(name.isEmpty ? '?' : name[0].toUpperCase()),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
          if (rating != null) ...[
            Text(rating!, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(width: 10),
          ],
          if (accuracy != null)
            Text(
              '${accuracy!.toStringAsFixed(1)}%',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
        ],
      ),
    );
  }
}
