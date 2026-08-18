import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/features/history/data/profile_repository.dart';

import '../../support/stub_http_adapter.dart';

void main() {
  test('fetches encoded profile with requested limit', () async {
    final fixture = File('test/fixtures/chesscom_profile.json').readAsStringSync();
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

    final profile = await DioProfileRepository(dio).fetchProfile('Alpha User', limit: 20);

    expect(captured?.method, 'GET');
    expect(captured?.path, '/api/chesscom/profile/Alpha%20User');
    expect(captured?.queryParameters['limit'], 20);
    expect(profile.username, 'Alpha');
  });
}
