import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'router.dart';
import 'theme/review_chess_theme.dart';

final _appRouter = createAppRouter();

class ReviewChessApp extends ConsumerWidget {
  const ReviewChessApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'ReviewChess',
      debugShowCheckedModeBanner: false,
      theme: ReviewChessTheme.light,
      darkTheme: ReviewChessTheme.dark,
      themeMode: ThemeMode.dark,
      routerConfig: _appRouter,
    );
  }
}
