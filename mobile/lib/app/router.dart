import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

GoRouter createAppRouter() {
  return GoRouter(
    initialLocation: '/review',
    routes: [
      GoRoute(
        path: '/review',
        builder: (context, state) => const AppShell(
          selectedIndex: 0,
          child: _PlaceholderPage(title: 'Review'),
        ),
      ),
      GoRoute(
        path: '/history',
        builder: (context, state) => const AppShell(
          selectedIndex: 1,
          child: _PlaceholderPage(title: 'History'),
        ),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const AppShell(
          selectedIndex: 2,
          child: _PlaceholderPage(title: 'Settings'),
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

class _PlaceholderPage extends StatelessWidget {
  const _PlaceholderPage({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Center(
        child: Text(
          title,
          style: Theme.of(context).textTheme.headlineMedium,
        ),
      ),
    );
  }
}
