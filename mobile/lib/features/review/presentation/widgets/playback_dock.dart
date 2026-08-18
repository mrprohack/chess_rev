import 'package:flutter/material.dart';

class PlaybackDock extends StatelessWidget {
  const PlaybackDock({
    required this.currentMove,
    required this.totalMoves,
    required this.keyMoments,
    required this.isPlaying,
    required this.onShare,
    required this.onFirst,
    required this.onPrevious,
    required this.onPlayPause,
    required this.onNext,
    required this.onLast,
    required this.onFlip,
    super.key,
  });

  final int currentMove;
  final int totalMoves;
  final int keyMoments;
  final bool isPlaying;
  final VoidCallback? onShare;
  final VoidCallback? onFirst;
  final VoidCallback? onPrevious;
  final VoidCallback? onPlayPause;
  final VoidCallback? onNext;
  final VoidCallback? onLast;
  final VoidCallback? onFlip;

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 6, 8, 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Move $currentMove / $totalMoves'),
                Text('$keyMoments key moments'),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _DockAction(label: 'Share', icon: Icons.share_outlined, onPressed: onShare),
                _DockAction(label: 'First', icon: Icons.first_page, onPressed: onFirst),
                _DockAction(label: 'Previous', icon: Icons.chevron_left, onPressed: onPrevious),
                _DockAction(
                  label: isPlaying ? 'Pause' : 'Play',
                  icon: isPlaying ? Icons.pause : Icons.play_arrow,
                  onPressed: onPlayPause,
                  emphasized: true,
                ),
                _DockAction(label: 'Next', icon: Icons.chevron_right, onPressed: onNext),
                _DockAction(label: 'Last', icon: Icons.last_page, onPressed: onLast),
                _DockAction(label: 'Flip', icon: Icons.flip, onPressed: onFlip),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DockAction extends StatelessWidget {
  const _DockAction({
    required this.label,
    required this.icon,
    required this.onPressed,
    this.emphasized = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback? onPressed;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      button: true,
      enabled: onPressed != null,
      label: label,
      child: SizedBox.square(
        dimension: 48,
        child: ExcludeSemantics(
          child: IconButton.filledTonal(
            onPressed: onPressed,
            iconSize: emphasized ? 26 : 22,
            padding: EdgeInsets.zero,
            icon: Icon(icon),
          ),
        ),
      ),
    );
  }
}
