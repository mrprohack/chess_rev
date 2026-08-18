import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/core/storage/local_cache.dart';
import 'package:reviewchess/core/storage/preferences_store.dart';
import 'package:reviewchess/features/settings/presentation/settings_screen.dart';

void main() {
  testWidgets('shows all seven settings sections', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          preferencesStoreProvider.overrideWithValue(MemoryPreferencesStore()),
          localCacheProvider.overrideWithValue(MemoryLocalCache()),
        ],
        child: const MaterialApp(home: SettingsScreen()),
      ),
    );
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
}
