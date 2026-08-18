import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/core/api/api_failure.dart';
import 'package:reviewchess/core/storage/local_cache.dart';
import 'package:reviewchess/data/models/app_settings.dart';
import 'package:reviewchess/data/models/chesscom_profile.dart';
import 'package:reviewchess/features/history/data/profile_repository.dart';
import 'package:reviewchess/features/history/presentation/history_controller.dart';
import 'package:reviewchess/features/settings/presentation/settings_controller.dart';

import '../../support/fixture_factory.dart';

class FakeProfileRepository implements ProfileRepository {
  FakeProfileRepository({required this.profile, this.failure});
  final ChessComProfile profile;
  final ApiFailure? failure;
  int? lastLimit;

  @override
  Future<ChessComProfile> fetchProfile(String username, {int limit = 12}) async {
    lastLimit = limit;
    if (failure != null) throw failure!;
    return profile;
  }
}

void main() {
  test('cached profile remains visible when refresh is offline', () async {
    final cache = MemoryLocalCache();
    await cache.writeProfile(fixtureProfile());
    final repository = FakeProfileRepository(
      profile: fixtureProfile(),
      failure: const OfflineFailure(),
    );
    final container = ProviderContainer(overrides: [
      localCacheProvider.overrideWithValue(cache),
      profileRepositoryProvider.overrideWithValue(repository),
      initialSettingsProvider.overrideWithValue(
        AppSettings.defaults().copyWith(chessComUsername: 'Alpha'),
      ),
    ]);
    addTearDown(container.dispose);

    await container.read(historyControllerProvider.notifier).load();
    final state = container.read(historyControllerProvider);
    expect(state.profile?.username, 'Alpha');
    expect(state.isOfflineSnapshot, isTrue);
    expect(repository.lastLimit, 20);
  });

  test('fresh profile replaces cached snapshot', () async {
    final cache = MemoryLocalCache();
    final fresh = fixtureProfile();
    final repository = FakeProfileRepository(profile: fresh);
    final container = ProviderContainer(overrides: [
      localCacheProvider.overrideWithValue(cache),
      profileRepositoryProvider.overrideWithValue(repository),
      initialSettingsProvider.overrideWithValue(
        AppSettings.defaults().copyWith(chessComUsername: 'Alpha'),
      ),
    ]);
    addTearDown(container.dispose);

    await container.read(historyControllerProvider.notifier).load();
    expect(container.read(historyControllerProvider).profile?.username, 'Alpha');
    expect(container.read(historyControllerProvider).isOfflineSnapshot, isFalse);
    expect((await cache.readProfile())?.username, 'Alpha');
  });
}
