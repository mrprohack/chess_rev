import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_failure.dart';
import '../../../data/models/chesscom_profile.dart';

abstract interface class ProfileRepository {
  Future<ChessComProfile> fetchProfile(String username, {int limit = 12});
}

class DioProfileRepository implements ProfileRepository {
  DioProfileRepository(this.dio);

  final Dio dio;

  @override
  Future<ChessComProfile> fetchProfile(
    String username, {
    int limit = 12,
  }) async {
    final cleaned = username.trim();
    if (cleaned.isEmpty) throw const InvalidAnalysisRequestFailure();
    final safeLimit = limit.clamp(1, 20);
    DioException? firstFailure;

    for (var attempt = 0; attempt < 2; attempt++) {
      try {
        final encoded = Uri.encodeComponent(cleaned);
        final response = await dio.get<Map<String, dynamic>>(
          '/api/chesscom/profile/$encoded',
          queryParameters: {'limit': safeLimit},
        );
        final data = response.data;
        if (data == null) throw const UnknownFailure();
        return ChessComProfile.fromJson(data);
      } on ApiFailure {
        rethrow;
      } on DioException catch (error) {
        final transient =
            error.type == DioExceptionType.connectionError ||
            error.type == DioExceptionType.connectionTimeout ||
            error.type == DioExceptionType.receiveTimeout ||
            error.type == DioExceptionType.sendTimeout;
        if (attempt == 0 && transient) {
          firstFailure = error;
          continue;
        }
        throw _profileFailure(error);
      } on FormatException {
        throw const UnknownFailure();
      }
    }

    throw _profileFailure(firstFailure!);
  }
}

ApiFailure _profileFailure(DioException error) {
  if (error.type == DioExceptionType.connectionError) {
    return const OfflineFailure();
  }
  if (error.type == DioExceptionType.connectionTimeout ||
      error.type == DioExceptionType.receiveTimeout ||
      error.type == DioExceptionType.sendTimeout) {
    return const RequestTimedOutFailure();
  }
  return ApiFailure.fromStatusCode(error.response?.statusCode);
}

final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => DioProfileRepository(ref.watch(dioProvider)),
);
