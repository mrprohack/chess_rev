import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/preferences_store.dart';
import '../../../data/models/app_settings.dart';

final initialSettingsProvider = Provider<AppSettings>(
  (ref) => AppSettings.defaults(),
);

final settingsProvider = NotifierProvider<SettingsController, AppSettings>(
  SettingsController.new,
);

class SettingsController extends Notifier<AppSettings> {
  @override
  AppSettings build() => ref.watch(initialSettingsProvider);

  Future<void> setReduceMotion(bool value) async {
    await _save(state.copyWith(reduceMotion: value));
  }

  Future<void> setChessComUsername(String value) async {
    await _save(state.copyWith(chessComUsername: value.trim()));
  }

  Future<void> reset() async {
    await _save(AppSettings.defaults());
  }

  Future<void> _save(AppSettings next) async {
    state = next;
    await ref.read(preferencesStoreProvider).saveSettings(next);
  }
}
