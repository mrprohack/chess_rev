import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api_config.dart';

Dio createApiClient(ApiConfig config) {
  return Dio(
    BaseOptions(
      baseUrl: config.baseUri.toString(),
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 90),
      sendTimeout: const Duration(seconds: 15),
      headers: const {'Accept': 'application/json'},
    ),
  );
}

final apiConfigProvider = Provider<ApiConfig>(
  (ref) => ApiConfig.fromEnvironment(),
);

final dioProvider = Provider<Dio>(
  (ref) => createApiClient(ref.watch(apiConfigProvider)),
);
