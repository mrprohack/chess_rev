import '../../../core/api/api_failure.dart';
import '../../../data/models/chesscom_profile.dart';

class HistoryState {
  const HistoryState({
    this.profile,
    this.loading = false,
    this.refreshing = false,
    this.isOfflineSnapshot = false,
    this.needsUsername = false,
    this.error,
  });

  final ChessComProfile? profile;
  final bool loading;
  final bool refreshing;
  final bool isOfflineSnapshot;
  final bool needsUsername;
  final ApiFailure? error;
}
