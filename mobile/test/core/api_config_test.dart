import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/core/api/api_config.dart';

void main() {
  test('debug defaults to Android emulator backend', () {
    expect(
      ApiConfig.fromEnvironment(
        releaseMode: false,
        configuredValue: '',
      ).baseUri.toString(),
      'http://10.0.2.2:8001',
    );
  });

  test('release requires explicit remote HTTPS backend', () {
    expect(
      () => ApiConfig.fromEnvironment(releaseMode: true, configuredValue: ''),
      throwsStateError,
    );
    expect(
      () => ApiConfig.fromEnvironment(
        releaseMode: true,
        configuredValue: 'http://api.reviewchess.in',
      ),
      throwsStateError,
    );
    expect(
      ApiConfig.fromEnvironment(
        releaseMode: true,
        configuredValue: 'https://api.reviewchess.in',
      ).baseUri.scheme,
      'https',
    );
  });
}
