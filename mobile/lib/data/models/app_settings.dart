class AppSettings {
  const AppSettings({
    required this.theme,
    required this.boardTheme,
    required this.showArrows,
    required this.showCoordinates,
    required this.soundEnabled,
    required this.soundVolume,
    required this.soundTheme,
    required this.autoPlaySpeedMs,
    required this.figurineNotation,
    required this.engine,
    required this.engineDepth,
    required this.maxTime,
    required this.numLines,
    required this.threads,
    required this.reduceMotion,
    required this.chessComUsername,
  });

  final String theme;
  final String boardTheme;
  final bool showArrows;
  final bool showCoordinates;
  final bool soundEnabled;
  final double soundVolume;
  final String soundTheme;
  final int autoPlaySpeedMs;
  final bool figurineNotation;
  final String engine;
  final int engineDepth;
  final int maxTime;
  final int numLines;
  final int threads;
  final bool reduceMotion;
  final String chessComUsername;

  factory AppSettings.defaults() => const AppSettings(
    theme: 'dark',
    boardTheme: 'wood',
    showArrows: true,
    showCoordinates: true,
    soundEnabled: true,
    soundVolume: 0.8,
    soundTheme: 'classic',
    autoPlaySpeedMs: 1000,
    figurineNotation: true,
    engine: 'stockfish18',
    engineDepth: 10,
    maxTime: 5,
    numLines: 3,
    threads: 1,
    reduceMotion: false,
    chessComUsername: '',
  );

  AppSettings copyWith({
    String? theme,
    String? boardTheme,
    bool? showArrows,
    bool? showCoordinates,
    bool? soundEnabled,
    double? soundVolume,
    String? soundTheme,
    int? autoPlaySpeedMs,
    bool? figurineNotation,
    String? engine,
    int? engineDepth,
    int? maxTime,
    int? numLines,
    int? threads,
    bool? reduceMotion,
    String? chessComUsername,
  }) {
    return AppSettings(
      theme: theme ?? this.theme,
      boardTheme: boardTheme ?? this.boardTheme,
      showArrows: showArrows ?? this.showArrows,
      showCoordinates: showCoordinates ?? this.showCoordinates,
      soundEnabled: soundEnabled ?? this.soundEnabled,
      soundVolume: soundVolume ?? this.soundVolume,
      soundTheme: soundTheme ?? this.soundTheme,
      autoPlaySpeedMs: autoPlaySpeedMs ?? this.autoPlaySpeedMs,
      figurineNotation: figurineNotation ?? this.figurineNotation,
      engine: engine ?? this.engine,
      engineDepth: engineDepth ?? this.engineDepth,
      maxTime: maxTime ?? this.maxTime,
      numLines: numLines ?? this.numLines,
      threads: threads ?? this.threads,
      reduceMotion: reduceMotion ?? this.reduceMotion,
      chessComUsername: chessComUsername ?? this.chessComUsername,
    );
  }

  @override
  bool operator ==(Object other) {
    return other is AppSettings &&
        other.theme == theme &&
        other.boardTheme == boardTheme &&
        other.showArrows == showArrows &&
        other.showCoordinates == showCoordinates &&
        other.soundEnabled == soundEnabled &&
        other.soundVolume == soundVolume &&
        other.soundTheme == soundTheme &&
        other.autoPlaySpeedMs == autoPlaySpeedMs &&
        other.figurineNotation == figurineNotation &&
        other.engine == engine &&
        other.engineDepth == engineDepth &&
        other.maxTime == maxTime &&
        other.numLines == numLines &&
        other.threads == threads &&
        other.reduceMotion == reduceMotion &&
        other.chessComUsername == chessComUsername;
  }

  @override
  int get hashCode => Object.hashAll([
    theme,
    boardTheme,
    showArrows,
    showCoordinates,
    soundEnabled,
    soundVolume,
    soundTheme,
    autoPlaySpeedMs,
    figurineNotation,
    engine,
    engineDepth,
    maxTime,
    numLines,
    threads,
    reduceMotion,
    chessComUsername,
  ]);
}
