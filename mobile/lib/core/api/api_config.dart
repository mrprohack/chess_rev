import 'package:flutter/foundation.dart';

class ApiConfig {
  const ApiConfig(this.baseUri);

  final Uri baseUri;

  factory ApiConfig.fromEnvironment({
    bool releaseMode = kReleaseMode,
    String? configuredValue,
  }) {
    final configured =
        configuredValue ??
        const String.fromEnvironment('API_BASE_URL', defaultValue: '');
    final value = configured.trim();

    if (value.isEmpty) {
      if (releaseMode) {
        throw StateError('Release builds require API_BASE_URL.');
      }
      return ApiConfig(Uri.parse('http://10.0.2.2:8001'));
    }

    final uri = Uri.tryParse(value);
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) {
      throw StateError('API_BASE_URL must be an absolute URI.');
    }

    if (releaseMode) {
      final host = uri.host.toLowerCase();
      final isLocal =
          host == 'localhost' ||
          host == '127.0.0.1' ||
          host == '10.0.2.2' ||
          host == '0.0.0.0';
      if (uri.scheme != 'https' || isLocal) {
        throw StateError('Release API_BASE_URL must use remote HTTPS.');
      }
    }

    return ApiConfig(uri);
  }
}
