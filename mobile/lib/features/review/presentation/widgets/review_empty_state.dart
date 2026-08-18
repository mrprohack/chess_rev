import 'package:flutter/material.dart';

class ReviewEmptyState extends StatelessWidget {
  const ReviewEmptyState({
    required this.controller,
    required this.loading,
    required this.onAnalyze,
    required this.onHistory,
    super.key,
  });

  final TextEditingController controller;
  final bool loading;
  final VoidCallback? onAnalyze;
  final VoidCallback onHistory;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Icon(
                  Icons.auto_graph_rounded,
                  size: 58,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: 18),
                Text(
                  'Review a Game',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Paste a Chess.com or Lichess game link and get a Stockfish review.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: controller,
                  keyboardType: TextInputType.url,
                  autocorrect: false,
                  decoration: const InputDecoration(
                    labelText: 'Game URL',
                    hintText: 'https://www.chess.com/game/...',
                    border: OutlineInputBorder(),
                  ),
                  onSubmitted: (_) => onAnalyze?.call(),
                ),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: loading ? null : onAnalyze,
                  icon: loading
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.analytics_outlined),
                  label: Text(loading ? 'Analyzing…' : 'Analyze Game'),
                ),
                const SizedBox(height: 8),
                TextButton.icon(
                  onPressed: onHistory,
                  icon: const Icon(Icons.history),
                  label: const Text('Pick from Chess.com History'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
