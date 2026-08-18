import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/history/presentation/history_screen.dart';
import '../features/review/presentation/review_screen.dart';
import '../features/settings/presentation/settings_screen.dart';

GoRouter createAppRouter() {
  return GoRouter(
    initialLocation: '/review',
    routes: [
      GoRoute(
        path: '/review',
        builder: (context, state) => AppShell(
          selectedIndex: 0,
          child: ReviewScreen(initialUrl: state.uri.queryParameters['url']),
        ),
      ),
      GoRoute(
        path: '/history',
        builder: (context, state) => const AppShell(
          selectedIndex: 1,
          child: HistoryScreen(),
        ),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const AppShell(
          selectedIndex: 2,
          child: SettingsScreen(),
        ),
      ),
    ],
  );
}

class AppShell extends StatelessWidget {
  const AppShell({
    required this.selectedIndex,
    required this.child,
    super.key,
  });

  final int selectedIndex;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: (index) {
          const locations = ['/review', '/history', '/settings'];
          context.go(locations[index]);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.analytics_outlined),
            selectedIcon: Icon(Icons.analytics),
            label: 'Review',
          ),
          NavigationDestination(
            icon: Icon(Icons.history_outlined),
            selectedIcon: Icon(Icons.history),
            label: 'History',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}
