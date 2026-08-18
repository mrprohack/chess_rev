import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/features/review/data/game_repository.dart';

import '../../support/stub_http_adapter.dart';

void main() {
  test('posts exact analysis request and decodes response', () async {
    final fixture = File('test/fixtures/chesscom_analysis.json').readAsStringSync();
    RequestOptions? captured;
    final dio = Dio(BaseOptions(baseUrl: 'https://api.reviewchess.in'));
    dio.httpClientAdapter = StubHttpAdapter((options) {
      captured = options;
      return ResponseBody.fromString(
        fixture,
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    });
    final repository = DioGameRepository(dio);
    const request = AnalyzeGameRequest(
      url: 'https://www.chess.com/game/170804338698',
      depth: 12,
      engine: 'stockfish18',
      maxTime: 5,
      numLines: 3,
      threads: 1,
    );

    final result = await repository.analyzeGame(request);

    expect(captured?.method, 'POST');
    expect(captured?.path, '/api/analyze');
    expect(jsonEncode(captured?.data), jsonEncode(request.toJson()));
    expect(result.white, 'Alpha');
    expect(result.moves.length, 2);
  });
}
