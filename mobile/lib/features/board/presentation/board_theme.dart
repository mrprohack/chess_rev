import 'package:flutter/material.dart';

class BoardPalette {
  const BoardPalette({required this.lightSquare, required this.darkSquare});

  final Color lightSquare;
  final Color darkSquare;

  @override
  bool operator ==(Object other) {
    return other is BoardPalette &&
        other.lightSquare == lightSquare &&
        other.darkSquare == darkSquare;
  }

  @override
  int get hashCode => Object.hash(lightSquare, darkSquare);
}

const _woodPalette = BoardPalette(
  lightSquare: Color(0xFFE8D0AA),
  darkSquare: Color(0xFF9A6B43),
);

const _greenPalette = BoardPalette(
  lightSquare: Color(0xFFEEEED2),
  darkSquare: Color(0xFF769656),
);

const _bluePalette = BoardPalette(
  lightSquare: Color(0xFFDDE6ED),
  darkSquare: Color(0xFF6B8CAF),
);

BoardPalette boardPaletteFor(String name) {
  return switch (name.toLowerCase()) {
    'green' => _greenPalette,
    'blue' => _bluePalette,
    _ => _woodPalette,
  };
}
