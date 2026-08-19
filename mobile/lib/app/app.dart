import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/sharing/incoming_game_link_controller.dart';
import '../core/sharing/share_intent_bridge.dart';
import '../features/review/presentation/review_controller.dart';
import '../features/settings/presentation/settings_controller.dart';
import 'router.dart';
import 'theme/review_chess_theme.dart';

class ReviewChessApp extends ConsumerStatefulWidget {
  const ReviewChessApp({this.enablePlatformLinks = false, super.key});

  final bool enablePlatformLinks;

  @override
  ConsumerState<ReviewChessApp> createState() => _ReviewChessAppState();
}

class _ReviewChessAppState extends ConsumerState<ReviewChessApp> {
  late final router = createAppRouter();
  StreamSubscription<Uri>? _uriSubscription;
  StreamSubscription<String>? _shareSubscription;

  @override
  void initState() {
    super.initState();
    if (widget.enablePlatformLinks) {
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => _startIncomingLinks(),
      );
    }
  }

  Future<void> _startIncomingLinks() async {
    final controller = IncomingGameLinkController(
      onGameUrl: (url) async {
        if (!mounted) return;
        router.go('/review');
        await ref.read(reviewControllerProvider.notifier).analyzeUrl(url);
      },
    );
    const bridge = ShareIntentBridge();
    final initialText = await bridge.getInitialSharedText();
    if (initialText != null) await controller.handleSharedText(initialText);
    _shareSubscription = bridge.sharedTextStream.listen(
      controller.handleSharedText,
    );
    _uriSubscription = AppLinks().uriLinkStream.listen(controller.handleUri);
  }

  @override
  void dispose() {
    _uriSubscription?.cancel();
    _shareSubscription?.cancel();
    router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = ref.watch(settingsProvider.select((value) => value.theme));
    final mode = switch (theme) {
      'light' => ThemeMode.light,
      'system' => ThemeMode.system,
      _ => ThemeMode.dark,
    };
    return MaterialApp.router(
      title: 'ReviewChess',
      debugShowCheckedModeBanner: false,
      theme: ReviewChessTheme.light,
      darkTheme: ReviewChessTheme.dark,
      themeMode: mode,
      routerConfig: router,
    );
  }
}
