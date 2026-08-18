import 'package:flutter/material.dart';

import '../../../../data/models/chesscom_profile.dart';

class ProfileHeader extends StatelessWidget {
  const ProfileHeader({required this.profile, super.key});

  final ChessComProfile profile;

  @override
  Widget build(BuildContext context) {
    final avatar = profile.avatar;
    return Card(
      margin: const EdgeInsets.all(12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundImage: avatar == null ? null : NetworkImage(avatar),
              child: avatar == null
                  ? Text(profile.username[0].toUpperCase())
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    profile.username,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 10,
                    children: [
                      Text('Rapid ${profile.ratings.rapid ?? '—'}'),
                      Text('Blitz ${profile.ratings.blitz ?? '—'}'),
                      Text('Bullet ${profile.ratings.bullet ?? '—'}'),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
