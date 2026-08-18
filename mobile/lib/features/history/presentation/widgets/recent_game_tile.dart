import 'package:flutter/material.dart';

import '../../../../data/models/chesscom_profile.dart';

class RecentGameTile extends StatelessWidget {
  const RecentGameTile({required this.game, required this.onTap, super.key});

  final RecentGame game;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: const CircleAvatar(child: Icon(Icons.sports_esports_outlined)),
      title: Text('${game.white.username} vs ${game.black.username}'),
      subtitle: Text(
        '${game.timeClass ?? 'Chess'} • ${game.white.rating ?? '—'} / ${game.black.rating ?? '—'}',
      ),
      trailing: const Icon(Icons.chevron_right),
    );
  }
}
