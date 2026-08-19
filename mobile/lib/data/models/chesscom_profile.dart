class ChessComProfile {
  const ChessComProfile({
    required this.username,
    required this.ratings,
    required this.games,
    this.name,
    this.avatar,
    this.url,
    this.status,
  });

  final String username;
  final String? name;
  final String? avatar;
  final String? url;
  final String? status;
  final ChessComRatings ratings;
  final List<RecentGame> games;

  factory ChessComProfile.fromJson(Map<String, dynamic> json) {
    final rawRatings = json['ratings'];
    final rawGames = json['games'];
    if (rawRatings is! Map || rawGames is! List) {
      throw const FormatException('profile ratings and games are required');
    }
    return ChessComProfile(
      username: _requiredString(json['username'], 'username'),
      name: _optionalString(json['name']),
      avatar: _optionalString(json['avatar']),
      url: _optionalString(json['url']),
      status: _optionalString(json['status']),
      ratings: ChessComRatings.fromJson(_asMap(rawRatings)),
      games: rawGames
          .map((item) => RecentGame.fromJson(_asMap(item)))
          .toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() => {
    'username': username,
    'name': name,
    'avatar': avatar,
    'url': url,
    'status': status,
    'ratings': ratings.toJson(),
    'games': games.map((game) => game.toJson()).toList(growable: false),
  };
}

class ChessComRatings {
  const ChessComRatings({this.rapid, this.blitz, this.bullet});

  final int? rapid;
  final int? blitz;
  final int? bullet;

  factory ChessComRatings.fromJson(Map<String, dynamic> json) {
    return ChessComRatings(
      rapid: _toInt(json['rapid']),
      blitz: _toInt(json['blitz']),
      bullet: _toInt(json['bullet']),
    );
  }

  Map<String, dynamic> toJson() => {
    'rapid': rapid,
    'blitz': blitz,
    'bullet': bullet,
  };
}

class RecentGame {
  const RecentGame({
    required this.url,
    required this.white,
    required this.black,
    this.uuid,
    this.endTime,
    this.timeClass,
    this.rated = false,
  });

  final String? uuid;
  final String url;
  final int? endTime;
  final String? timeClass;
  final bool rated;
  final RecentPlayer white;
  final RecentPlayer black;

  factory RecentGame.fromJson(Map<String, dynamic> json) {
    return RecentGame(
      uuid: _optionalString(json['uuid']),
      url: _requiredString(json['url'], 'url'),
      endTime: _toInt(json['end_time']),
      timeClass: _optionalString(json['time_class']),
      rated: json['rated'] == true,
      white: RecentPlayer.fromJson(_asMap(json['white'])),
      black: RecentPlayer.fromJson(_asMap(json['black'])),
    );
  }

  Map<String, dynamic> toJson() => {
    'uuid': uuid,
    'url': url,
    'end_time': endTime,
    'time_class': timeClass,
    'rated': rated,
    'white': white.toJson(),
    'black': black.toJson(),
  };
}

class RecentPlayer {
  const RecentPlayer({required this.username, this.rating, this.result});

  final String username;
  final int? rating;
  final String? result;

  factory RecentPlayer.fromJson(Map<String, dynamic> json) {
    return RecentPlayer(
      username: _requiredString(json['username'], 'username'),
      rating: _toInt(json['rating']),
      result: _optionalString(json['result']),
    );
  }

  Map<String, dynamic> toJson() => {
    'username': username,
    'rating': rating,
    'result': result,
  };
}

Map<String, dynamic> _asMap(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, item) => MapEntry(key.toString(), item));
  }
  throw const FormatException('expected object');
}

String _requiredString(Object? value, String label) {
  if (value is String && value.isNotEmpty) {
    return value;
  }
  throw FormatException('$label is required');
}

String? _optionalString(Object? value) {
  if (value == null) {
    return null;
  }
  final string = value.toString();
  return string.isEmpty ? null : string;
}

int? _toInt(Object? value) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  return int.tryParse(value?.toString() ?? '');
}
