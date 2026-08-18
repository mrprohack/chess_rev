import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/core/storage/local_cache.dart';
import 'package:reviewchess/core/storage/preferences_store.dart';
import 'package:reviewchess/features/settings/presentation/settings_screen.dart';

Widget testApp() {
  return ProviderScope(
    overrides: [
      preferencesStoreProvider.overrideWithValue(MemoryPreferencesStore()),
      localCacheProvider.overrideWithValue(MemoryLocalCache()),
    ],
    child: const MaterialApp(home: SettingsScreen()),
  );
}

void main() {
  testWidgets('shows all seven settings sections', (tester) async {
    await tester.pumpWidget(testApp());
    for (final title in [
      'Profile',
      'Board',
      'Analysis',
      'Playback',
      'Appearance',
      'Accessibility',
      'Local Data',
    ]) {
      expect(find.text(title), findsOneWidget);
    }
  });

  testWidgets('exposes complete engine and playback settings', (tester) async {
    await tester.pumpWidget(testApp());
    expect(find.text('Depth: 10'), findsOneWidget);
    expect(find.text('Maximum time: 5'), findsOneWidget);
    expect(find.text('Lines: 3'), findsOneWidget);
    expect(find.text('Threads: 1'), findsOneWidget);
    expect(find.text('Sound theme'), findsOneWidget);
    expect(find.text('Autoplay speed: 1000'), findsOneWidget);
  });
}
