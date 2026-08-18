import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'history_controller.dart';
import 'widgets/profile_header.dart';
import 'widgets/recent_game_tile.dart';

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(historyControllerProvider.notifier).load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(historyControllerProvider);
    if (state.needsUsername) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.person_add_alt_1, size: 48),
              const SizedBox(height: 12),
              const Text('Add your Chess.com username in Settings.'),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () => context.go('/settings'),
                child: const Text('Open Settings'),
              ),
            ],
          ),
        ),
      );
    }

    final profile = state.profile;
    return RefreshIndicator(
      onRefresh: ref.read(historyControllerProvider.notifier).load,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverAppBar(
            title: const Text('History'),
            floating: true,
            actions: [
              IconButton(
                onPressed: state.refreshing
                    ? null
                    : ref.read(historyControllerProvider.notifier).load,
                tooltip: 'Refresh history',
                icon: const Icon(Icons.refresh),
              ),
            ],
          ),
          if (state.isOfflineSnapshot)
            const SliverToBoxAdapter(
              child: MaterialBanner(
                content: Text('Offline — showing saved profile'),
                actions: [SizedBox.shrink()],
              ),
            ),
          if (state.loading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            )
          else if (profile == null)
            SliverFillRemaining(
              child: Center(
                child: Text(state.error?.message ?? 'No profile data available.'),
              ),
            )
          else ...[
            SliverToBoxAdapter(child: ProfileHeader(profile: profile)),
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, 8, 16, 4),
                child: Text(
                  'Recent Games',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
            ),
            SliverList.builder(
              itemCount: profile.games.length,
              itemBuilder: (context, index) {
                final game = profile.games[index];
                return RecentGameTile(
                  game: game,
                  onTap: () => context.go(
                    '/review?url=${Uri.encodeQueryComponent(game.url)}',
                  ),
                );
              },
            ),
          ],
        ],
      ),
    );
  }
}
