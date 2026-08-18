import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/data/models/chesscom_profile.dart';
import 'package:reviewchess/data/models/game_analysis.dart';

void main() {
  test('decodes documented analysis and profile contracts', () {
    final analysisJson =
        jsonDecode(
              File('test/fixtures/chesscom_analysis.json').readAsStringSync(),
            )
            as Map<String, dynamic>;
    final profileJson =
        jsonDecode(
              File('test/fixtures/chesscom_profile.json').readAsStringSync(),
            )
            as Map<String, dynamic>;
    final analysis = GameAnalysis.fromJson(analysisJson);
    final profile = ChessComProfile.fromJson(profileJson);
    expect(analysis.moves.first.fen, isNotEmpty);
    expect(analysis.moves.first.classification, 'Book');
    expect(analysis.accuracy?.white, 99.2);
    expect(profile.ratings.rapid, 1550);
    expect(profile.games.single.url, contains('chess.com'));
  });
}
