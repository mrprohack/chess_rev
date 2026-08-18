import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app/app.dart';
import 'core/storage/local_cache.dart';
import 'core/storage/preferences_store.dart';
import 'features/settings/presentation/settings_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations(const [
    DeviceOrientation.portraitUp,
  ]);

  final preferences = await SharedPreferences.getInstance();
  final preferencesStore = SharedPreferencesStore(preferences);
  final initialSettings = await preferencesStore.loadSettings();
  await Hive.initFlutter();
  final cacheBox = await Hive.openBox<dynamic>('reviewchess_cache');

  runApp(
    ProviderScope(
      overrides: [
        preferencesStoreProvider.overrideWithValue(preferencesStore),
        initialSettingsProvider.overrideWithValue(initialSettings),
        localCacheProvider.overrideWithValue(HiveLocalCache(cacheBox)),
      ],
      child: const ReviewChessApp(enablePlatformLinks: true),
    ),
  );
}
