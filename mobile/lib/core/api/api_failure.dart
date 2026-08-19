sealed class ApiFailure implements Exception {
  const ApiFailure(this.message);

  final String message;

  static ApiFailure fromStatusCode(int? statusCode, {bool offline = false}) {
    if (offline) return const OfflineFailure();
    return switch (statusCode) {
      400 => const InvalidGameUrlFailure(),
      404 => const NotFoundFailure(),
      422 => const InvalidAnalysisRequestFailure(),
      429 => const RateLimitedFailure(),
      502 => const ProviderUnavailableFailure(),
      503 => const EngineUnavailableFailure(),
      504 => const RequestTimedOutFailure(),
      _ => const UnknownFailure(),
    };
  }

  @override
  String toString() => '$runtimeType: $message';
}

final class InvalidGameUrlFailure extends ApiFailure {
  const InvalidGameUrlFailure()
    : super('Enter a valid Chess.com or Lichess game URL.');
}

final class InvalidAnalysisRequestFailure extends ApiFailure {
  const InvalidAnalysisRequestFailure()
    : super('The game could not be analyzed.');
}

final class NotFoundFailure extends ApiFailure {
  const NotFoundFailure()
    : super('The requested game or profile was not found.');
}

final class RateLimitedFailure extends ApiFailure {
  const RateLimitedFailure()
    : super('The chess provider is rate limiting requests. Try again shortly.');
}

final class ProviderUnavailableFailure extends ApiFailure {
  const ProviderUnavailableFailure()
    : super('The chess provider is temporarily unavailable.');
}

final class EngineUnavailableFailure extends ApiFailure {
  const EngineUnavailableFailure()
    : super('The chess engine is temporarily unavailable.');
}

final class RequestTimedOutFailure extends ApiFailure {
  const RequestTimedOutFailure() : super('The request timed out. Try again.');
}

final class OfflineFailure extends ApiFailure {
  const OfflineFailure()
    : super('You are offline. New analysis requires an internet connection.');
}

final class UnknownFailure extends ApiFailure {
  const UnknownFailure() : super('Something went wrong. Try again.');
}
