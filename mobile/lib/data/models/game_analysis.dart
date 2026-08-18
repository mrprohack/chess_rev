class GameAnalysis {
  const GameAnalysis({
    required this.white,
    required this.black,
    required this.result,
    required this.moves,
    required this.counts,
    this.whiteRating,
    this.blackRating,
    this.baseTime = 0,
    this.accuracy,
  });

  final String white;
  final String? whiteRating;
  final String black;
  final String? blackRating;
  final String result;
  final int baseTime;
  final List<GameMove> moves;
  final Map<String, Map<String, int>> counts;
  final PlayerAccuracy? accuracy;

  factory GameAnalysis.fromJson(Map<String, dynamic> json) {
    final rawMoves = json['moves'];
    if (rawMoves is! List) throw const FormatException('moves must be a list');
    return GameAnalysis(
      white: _requiredString(json, 'white'),
      whiteRating: _optionalString(json['white_rating']),
      black: _requiredString(json, 'black'),
      blackRating: _optionalString(json['black_rating']),
      result: _requiredString(json, 'result'),
      baseTime: _toInt(json['base_time']) ?? 0,
      moves: rawMoves
          .map((item) => GameMove.fromJson(_asMap(item, 'move')))
          .toList(growable: false),
      counts: _decodeCounts(json['counts']),
      accuracy: json['accuracy'] is Map
          ? PlayerAccuracy.fromJson(_asMap(json['accuracy'], 'accuracy'))
          : null,
    );
  }
}

class GameMove {
  const GameMove({
    required this.number,
    required this.color,
    required this.notation,
    required this.classification,
    required this.fen,
    this.time,
    this.evaluation,
    this.clock,
    this.playedMove,
    this.bestMove,
  });

  final int number;
  final String color;
  final String notation;
  final String classification;
  final String fen;
  final String? time;
  final double? evaluation;
  final double? clock;
  final String? playedMove;
  final String? bestMove;

  factory GameMove.fromJson(Map<String, dynamic> json) {
    final number = _toInt(json['number']);
    if (number == null) throw const FormatException('move number is required');
    return GameMove(
      number: number,
      color: _requiredString(json, 'color'),
      notation: _requiredString(json, 'notation'),
      classification: _requiredString(json, 'classification'),
      fen: _requiredString(json, 'fen'),
      time: _optionalString(json['time']),
      evaluation: _toDouble(json['eval']),
      clock: _toDouble(json['clock']),
      playedMove: _optionalString(json['played_move']),
      bestMove: _optionalString(json['best_move']),
    );
  }
}

class PlayerAccuracy {
  const PlayerAccuracy({required this.white, required this.black});

  final double white;
  final double black;

  factory PlayerAccuracy.fromJson(Map<String, dynamic> json) {
    final white = _toDouble(json['white']);
    final black = _toDouble(json['black']);
    if (white == null || black == null) {
      throw const FormatException('accuracy values are required');
    }
    return PlayerAccuracy(white: white, black: black);
  }
}

Map<String, Map<String, int>> _decodeCounts(Object? value) {
  if (value is! Map) return const {};
  final result = <String, Map<String, int>>{};
  for (final entry in value.entries) {
    if (entry.value is! Map) continue;
    final inner = <String, int>{};
    for (final countEntry in (entry.value as Map).entries) {
      final count = _toInt(countEntry.value);
      if (count != null) inner[countEntry.key.toString()] = count;
    }
    result[entry.key.toString()] = inner;
  }
  return result;
}

Map<String, dynamic> _asMap(Object? value, String label) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return value.map((key, item) => MapEntry(key.toString(), item));
  throw FormatException('$label must be an object');
}

String _requiredString(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is String && value.isNotEmpty) return value;
  throw FormatException('$key is required');
}

String? _optionalString(Object? value) {
  if (value == null) return null;
  final string = value.toString();
  return string.isEmpty ? null : string;
}

int? _toInt(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '');
}

double? _toDouble(Object? value) {
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '');
}
