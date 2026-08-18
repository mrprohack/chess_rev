import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_failure.dart';
import '../../../core/storage/local_cache.dart';
import '../../settings/presentation/settings_controller.dart';
import '../data/profile_repository.dart';
import 'history_state.dart';

final historyControllerProvider =
    NotifierProvider<HistoryController, HistoryState>(HistoryController.new);

class HistoryController extends Notifier<HistoryState> {
  @override
  HistoryState build() => const HistoryState();

  Future<void> load() async {
    final username = ref.read(settingsProvider).chessComUsername.trim();
    if (username.isEmpty) {
      state = const HistoryState(needsUsername: true);
      return;
    }

    final cache = ref.read(localCacheProvider);
    final cached = await cache.readProfile();
    state = HistoryState(
      profile: cached,
      loading: cached == null,
      refreshing: cached != null,
    );

    try {
      final fresh = await ref
          .read(profileRepositoryProvider)
          .fetchProfile(username, limit: 20);
      await cache.writeProfile(fresh);
      state = HistoryState(profile: fresh);
    } on ApiFailure catch (failure) {
      state = HistoryState(
        profile: cached,
        isOfflineSnapshot: cached != null,
        error: failure,
      );
    } catch (_) {
      state = HistoryState(
        profile: cached,
        isOfflineSnapshot: cached != null,
        error: const UnknownFailure(),
      );
    }
  }
}
