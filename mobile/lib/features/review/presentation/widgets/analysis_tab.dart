import 'package:flutter/material.dart';

import '../../../../data/models/game_analysis.dart';

class AnalysisTab extends StatelessWidget {
  const AnalysisTab({required this.game, super.key});

  final GameAnalysis game;

  @override
  Widget build(BuildContext context) {
    final accuracy = game.accuracy;
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        Text('Game Summary', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 10),
        Text('White Accuracy: ${accuracy?.white.toStringAsFixed(1) ?? '—'}%'),
        Text('Black Accuracy: ${accuracy?.black.toStringAsFixed(1) ?? '—'}%'),
        const SizedBox(height: 12),
        ...game.counts.entries.map(
          (side) => Card(
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    side.key[0].toUpperCase() + side.key.substring(1),
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  ...side.value.entries.map(
                    (entry) => Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [Text(entry.key), Text('${entry.value}')],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
