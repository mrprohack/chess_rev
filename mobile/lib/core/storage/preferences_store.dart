import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../data/models/app_settings.dart';

abstract interface class PreferencesStore {
  Future<AppSettings> loadSettings();
  Future<void> saveSettings(AppSettings settings);
}

class MemoryPreferencesStore implements PreferencesStore {
  MemoryPreferencesStore([AppSettings? initial])
    : _settings = initial ?? AppSettings.defaults();

  AppSettings _settings;

  @override
  Future<AppSettings> loadSettings() async => _settings;

  @override
  Future<void> saveSettings(AppSettings settings) async {
    _settings = settings;
  }
}

class SharedPreferencesStore implements PreferencesStore {
  SharedPreferencesStore(this.preferences);

  final SharedPreferences preferences;

  static const _prefix = 'reviewchess.';

  @override
  Future<AppSettings> loadSettings() async {
    final defaults = AppSettings.defaults();
    return defaults.copyWith(
      theme: preferences.getString('${_prefix}theme') ?? defaults.theme,
      boardTheme:
          preferences.getString('${_prefix}boardTheme') ?? defaults.boardTheme,
      showArrows:
          preferences.getBool('${_prefix}showArrows') ?? defaults.showArrows,
      showCoordinates:
          preferences.getBool('${_prefix}showCoordinates') ??
          defaults.showCoordinates,
      soundEnabled:
          preferences.getBool('${_prefix}soundEnabled') ??
          defaults.soundEnabled,
      soundVolume:
          preferences.getDouble('${_prefix}soundVolume') ??
          defaults.soundVolume,
      soundTheme:
          preferences.getString('${_prefix}soundTheme') ?? defaults.soundTheme,
      autoPlaySpeedMs:
          preferences.getInt('${_prefix}autoPlaySpeedMs') ??
          defaults.autoPlaySpeedMs,
      figurineNotation:
          preferences.getBool('${_prefix}figurineNotation') ??
          defaults.figurineNotation,
      engine: preferences.getString('${_prefix}engine') ?? defaults.engine,
      engineDepth:
          preferences.getInt('${_prefix}engineDepth') ?? defaults.engineDepth,
      maxTime: preferences.getInt('${_prefix}maxTime') ?? defaults.maxTime,
      numLines: preferences.getInt('${_prefix}numLines') ?? defaults.numLines,
      threads: preferences.getInt('${_prefix}threads') ?? defaults.threads,
      reduceMotion:
          preferences.getBool('${_prefix}reduceMotion') ??
          defaults.reduceMotion,
      chessComUsername:
          preferences.getString('${_prefix}chessComUsername') ??
          defaults.chessComUsername,
    );
  }

  @override
  Future<void> saveSettings(AppSettings settings) async {
    await preferences.setString('${_prefix}theme', settings.theme);
    await preferences.setString('${_prefix}boardTheme', settings.boardTheme);
    await preferences.setBool('${_prefix}showArrows', settings.showArrows);
    await preferences.setBool(
      '${_prefix}showCoordinates',
      settings.showCoordinates,
    );
    await preferences.setBool('${_prefix}soundEnabled', settings.soundEnabled);
    await preferences.setDouble('${_prefix}soundVolume', settings.soundVolume);
    await preferences.setString('${_prefix}soundTheme', settings.soundTheme);
    await preferences.setInt(
      '${_prefix}autoPlaySpeedMs',
      settings.autoPlaySpeedMs,
    );
    await preferences.setBool(
      '${_prefix}figurineNotation',
      settings.figurineNotation,
    );
    await preferences.setString('${_prefix}engine', settings.engine);
    await preferences.setInt('${_prefix}engineDepth', settings.engineDepth);
    await preferences.setInt('${_prefix}maxTime', settings.maxTime);
    await preferences.setInt('${_prefix}numLines', settings.numLines);
    await preferences.setInt('${_prefix}threads', settings.threads);
    await preferences.setBool('${_prefix}reduceMotion', settings.reduceMotion);
    await preferences.setString(
      '${_prefix}chessComUsername',
      settings.chessComUsername,
    );
  }
}

final preferencesStoreProvider = Provider<PreferencesStore>(
  (ref) => MemoryPreferencesStore(),
);
