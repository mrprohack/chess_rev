import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_failure.dart';
import '../../../data/models/game_analysis.dart';

class AnalyzeGameRequest {
  const AnalyzeGameRequest({
    required this.url,
    required this.depth,
    required this.engine,
    required this.maxTime,
    required this.numLines,
    required this.threads,
  });

  final String url;
  final int depth;
  final String engine;
  final int maxTime;
  final int numLines;
  final int threads;

  Map<String, dynamic> toJson() => {
    'url': url,
    'depth': depth,
    'engine': engine,
    'maxTime': maxTime,
    'numLines': numLines,
    'threads': threads,
  };
}

abstract interface class GameRepository {
  Future<GameAnalysis> analyzeGame(AnalyzeGameRequest request);
}

class DioGameRepository implements GameRepository {
  DioGameRepository(this.dio);

  final Dio dio;

  @override
  Future<GameAnalysis> analyzeGame(AnalyzeGameRequest request) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/api/analyze',
        data: request.toJson(),
      );
      final data = response.data;
      if (data == null) throw const UnknownFailure();
      return GameAnalysis.fromJson(data);
    } on ApiFailure {
      rethrow;
    } on DioException catch (error) {
      throw _mapDioFailure(error);
    } on FormatException {
      throw const UnknownFailure();
    }
  }
}

ApiFailure _mapDioFailure(DioException error) {
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

final gameRepositoryProvider = Provider<GameRepository>(
  (ref) => DioGameRepository(ref.watch(dioProvider)),
);
