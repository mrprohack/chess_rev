import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/core/storage/preferences_store.dart';
import 'package:reviewchess/data/models/app_settings.dart';
import 'package:reviewchess/features/settings/presentation/settings_controller.dart';

void main() {
  test('persists settings updates and reset', () async {
    final store = MemoryPreferencesStore();
    final container = ProviderContainer(
      overrides: [preferencesStoreProvider.overrideWithValue(store)],
    );
    addTearDown(container.dispose);
    final notifier = container.read(settingsProvider.notifier);
    await notifier.setReduceMotion(true);
    expect(container.read(settingsProvider).reduceMotion, isTrue);
    expect((await store.loadSettings()).reduceMotion, isTrue);
    await notifier.reset();
    expect(container.read(settingsProvider), AppSettings.defaults());
  });
}
