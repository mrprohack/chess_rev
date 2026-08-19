import 'package:flutter/material.dart';

abstract final class ReviewChessTheme {
  static ThemeData get dark {
    const seed = Color(0xFF81B64C);
    return ThemeData(
      brightness: Brightness.dark,
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: seed,
        brightness: Brightness.dark,
      ),
      scaffoldBackgroundColor: const Color(0xFF171717),
    );
  }

  static ThemeData get light {
    const seed = Color(0xFF5C8F2F);
    return ThemeData(
      brightness: Brightness.light,
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: seed),
    );
  }
}
