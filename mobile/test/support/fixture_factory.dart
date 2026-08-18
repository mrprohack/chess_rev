import 'dart:convert';
import 'dart:io';

import 'package:reviewchess/data/models/chesscom_profile.dart';
import 'package:reviewchess/data/models/game_analysis.dart';

GameAnalysis fixtureGameAnalysis() {
  final json = jsonDecode(
    File('test/fixtures/chesscom_analysis.json').readAsStringSync(),
  ) as Map<String, dynamic>;
  return GameAnalysis.fromJson(json);
}

ChessComProfile fixtureProfile() {
  final json = jsonDecode(
    File('test/fixtures/chesscom_profile.json').readAsStringSync(),
  ) as Map<String, dynamic>;
  return ChessComProfile.fromJson(json);
}
