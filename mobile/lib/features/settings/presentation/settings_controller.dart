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

  Future<void> setTheme(String value) => _save(state.copyWith(theme: value));
  Future<void> setBoardTheme(String value) =>
      _save(state.copyWith(boardTheme: value));
  Future<void> setShowArrows(bool value) =>
      _save(state.copyWith(showArrows: value));
  Future<void> setShowCoordinates(bool value) =>
      _save(state.copyWith(showCoordinates: value));
  Future<void> setSoundEnabled(bool value) =>
      _save(state.copyWith(soundEnabled: value));
  Future<void> setSoundVolume(double value) =>
      _save(state.copyWith(soundVolume: value.clamp(0, 1)));
  Future<void> setSoundTheme(String value) =>
      _save(state.copyWith(soundTheme: value));
  Future<void> setAutoPlaySpeed(int value) =>
      _save(state.copyWith(autoPlaySpeedMs: value.clamp(250, 5000)));
  Future<void> setFigurineNotation(bool value) =>
      _save(state.copyWith(figurineNotation: value));
  Future<void> setEngine(String value) => _save(state.copyWith(engine: value));
  Future<void> setEngineDepth(int value) =>
      _save(state.copyWith(engineDepth: value.clamp(1, 30)));
  Future<void> setMaxTime(int value) =>
      _save(state.copyWith(maxTime: value.clamp(1, 30)));
  Future<void> setNumLines(int value) =>
      _save(state.copyWith(numLines: value.clamp(1, 5)));
  Future<void> setThreads(int value) =>
      _save(state.copyWith(threads: value.clamp(1, 8)));
  Future<void> setReduceMotion(bool value) =>
      _save(state.copyWith(reduceMotion: value));
  Future<void> setChessComUsername(String value) =>
      _save(state.copyWith(chessComUsername: value.trim()));

  Future<void> reset() => _save(AppSettings.defaults());

  Future<void> _save(AppSettings next) async {
    state = next;
    await ref.read(preferencesStoreProvider).saveSettings(next);
  }
}
