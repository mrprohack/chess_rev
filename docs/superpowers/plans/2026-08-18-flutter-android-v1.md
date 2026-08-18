# ReviewChess Flutter Android V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-oriented portrait-only Flutter Android client in `mobile/` that reaches feature parity with the mobile-relevant ReviewChess web experience while reusing the existing FastAPI/Stockfish backend.

**Architecture:** The Flutter client uses Riverpod controllers, repository interfaces, Dio networking, SharedPreferences for scalar settings, Hive for lightweight structured local data, and a custom layered chessboard. Manual URL entry, History selection, Android `ACTION_SEND`, and `reviewchess://` deep links all converge on one validated `ReviewController.analyzeUrl()` pipeline; full game analysis remains server-side and is not persisted on-device.

**Tech Stack:** Flutter/Dart, Material 3, `flutter_riverpod`, `dio`, `go_router`, `freezed`, `json_serializable`, `shared_preferences`, Hive, `app_links`, `flutter_svg`, local audio playback, Android Kotlin platform channel, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-18-flutter-android-design.md`

## Global Constraints

- Android only for V1.
- Flutter project root is `mobile/`.
- Permanent Android application ID is `com.reviewchess.app`; display name is `ReviewChess`.
- Portrait orientation only; no landscape/tablet-specific V1 layout.
- Reuse existing FastAPI endpoints and Stockfish server analysis; do not run Stockfish on-device.
- Do not persist full `GameAnalysis` payloads across launches.
- Persist only settings, Chess.com username/profile snapshot, bookmarks, recent URLs, and last opened URL.
- Production release API traffic must be HTTPS and supplied explicitly through `API_BASE_URL`.
- Manual URL entry, History, Android Share Intent, and custom deep links must use the same URL validation and analysis pipeline.
- Accepted automatic-analysis providers are Chess.com and Lichess legitimate hosts only; reject deceptive suffix hosts.
- Custom chessboard is review-only: no drag-to-play and no board double-tap flip in V1.
- Playback controls remain persistent and each interactive target is at least 48x48 dp.
- `currentMoveIndex` is the single authoritative move-selection state.
- Reduced-motion mode removes decorative board effects and uses immediate position updates plus simple highlights.
- Existing backend and web CI jobs must remain green.

---

## File Map

The implementation will create or modify these responsibility boundaries:

```text
mobile/
├── pubspec.yaml                                  # Flutter dependencies/assets
├── analysis_options.yaml                         # lint/analyzer settings
├── lib/main.dart                                 # bootstrap only
├── lib/app/app.dart                              # MaterialApp + portrait bootstrap
├── lib/app/router.dart                           # Review/History/Settings/deep-link routes
├── lib/app/theme/review_chess_theme.dart         # Material 3 theme tokens
├── lib/core/api/api_config.dart                  # API_BASE_URL validation
├── lib/core/api/api_client.dart                  # Dio creation/interceptors
├── lib/core/api/api_failure.dart                 # typed failure model + mapper
├── lib/core/sharing/game_url_parser.dart         # supported URL extraction/validation
├── lib/core/sharing/share_intent_bridge.dart     # MethodChannel/EventChannel boundary
├── lib/core/storage/preferences_store.dart       # SharedPreferences scalar settings
├── lib/core/storage/local_cache.dart             # Hive profile/bookmarks/recent URLs
├── lib/data/models/game_analysis.dart            # typed analysis models
├── lib/data/models/chesscom_profile.dart         # typed profile/history models
├── lib/data/models/app_settings.dart             # immutable settings model
├── lib/features/review/data/game_repository.dart # API abstraction + Dio implementation
├── lib/features/review/presentation/review_controller.dart
├── lib/features/review/presentation/review_state.dart
├── lib/features/review/presentation/review_screen.dart
├── lib/features/review/presentation/widgets/*    # review-specific widgets
├── lib/features/board/domain/board_position.dart # FEN parser/domain model
├── lib/features/board/domain/move_transition.dart
├── lib/features/board/presentation/chess_board_view.dart
├── lib/features/board/presentation/board_motion_controller.dart
├── lib/features/history/data/profile_repository.dart
├── lib/features/history/presentation/history_controller.dart
├── lib/features/history/presentation/history_screen.dart
├── lib/features/settings/presentation/settings_controller.dart
├── lib/features/settings/presentation/settings_screen.dart
├── assets/pieces/{bB,bK,bN,bP,bQ,bR,wB,wK,wN,wP,wQ,wR}.svg
├── assets/sounds/*.wav
├── test/fixtures/*.json
├── test/core/*
├── test/data/*
├── test/features/*
├── integration_test/review_flow_test.dart
├── integration_test/deep_link_flow_test.dart
└── android/app/src/main/kotlin/com/reviewchess/app/MainActivity.kt

.github/workflows/check.yml                       # add Flutter Android CI job
README.md                                         # add Android development commands
```

---

### Task 1: Scaffold the Flutter Android application and app shell

**Files:**
- Create: `mobile/pubspec.yaml`
- Create: `mobile/analysis_options.yaml`
- Create: `mobile/lib/main.dart`
- Create: `mobile/lib/app/app.dart`
- Create: `mobile/lib/app/router.dart`
- Create: `mobile/lib/app/theme/review_chess_theme.dart`
- Create: `mobile/test/app/app_smoke_test.dart`
- Modify generated: `mobile/android/app/build.gradle.kts`
- Modify generated: `mobile/android/app/src/main/AndroidManifest.xml`
- Create/move generated: `mobile/android/app/src/main/kotlin/com/reviewchess/app/MainActivity.kt`

**Interfaces:**
- Produces: `ReviewChessApp extends ConsumerWidget`.
- Produces: `GoRouter createAppRouter()` with `/review`, `/history`, `/settings`.
- Produces: Android package/application ID `com.reviewchess.app` and portrait-only activity.
- Later tasks consume the router and shell without changing app bootstrap responsibilities.

- [ ] **Step 1: Scaffold Flutter and add dependencies**

Run from repository root:

```bash
flutter create --platforms=android --org com.reviewchess --project-name reviewchess mobile
cd mobile
flutter pub add flutter_riverpod dio go_router freezed_annotation json_annotation shared_preferences hive hive_flutter app_links flutter_svg connectivity_plus just_audio
flutter pub add --dev build_runner freezed json_serializable mocktail custom_lint riverpod_lint
```

Then set `name: reviewchess`, declare `assets/pieces/` and `assets/sounds/`, and keep the generated `pubspec.lock` committed.

- [ ] **Step 2: Write the app-shell test first**

Create `mobile/test/app/app_smoke_test.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/app/app.dart';

void main() {
  testWidgets('starts on Review with three primary destinations', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: ReviewChessApp()));
    await tester.pumpAndSettle();

    expect(find.text('Review'), findsWidgets);
    expect(find.text('History'), findsOneWidget);
    expect(find.text('Settings'), findsOneWidget);
    expect(find.byType(NavigationBar), findsOneWidget);
  });
}
```

- [ ] **Step 3: Run the test and verify RED**

```bash
cd mobile
flutter test test/app/app_smoke_test.dart
```

Expected: FAIL because `ReviewChessApp` and application routes do not exist.

- [ ] **Step 4: Implement the minimal app shell**

`mobile/lib/main.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations(const [DeviceOrientation.portraitUp]);
  runApp(const ProviderScope(child: ReviewChessApp()));
}
```

`mobile/lib/app/router.dart` starts with placeholder screen widgets that are real navigable Material pages, not feature implementations:

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

GoRouter createAppRouter() => GoRouter(
  initialLocation: '/review',
  routes: [
    GoRoute(path: '/review', builder: (_, __) => const _Shell(index: 0)),
    GoRoute(path: '/history', builder: (_, __) => const _Shell(index: 1)),
    GoRoute(path: '/settings', builder: (_, __) => const _Shell(index: 2)),
  ],
);

class _Shell extends StatelessWidget {
  const _Shell({required this.index});
  final int index;

  @override
  Widget build(BuildContext context) {
    const labels = ['Review', 'History', 'Settings'];
    return Scaffold(
      body: Center(child: Text(labels[index])),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (next) => context.go(['/review', '/history', '/settings'][next]),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.analytics_outlined), label: 'Review'),
          NavigationDestination(icon: Icon(Icons.history), label: 'History'),
          NavigationDestination(icon: Icon(Icons.settings_outlined), label: 'Settings'),
        ],
      ),
    );
  }
}
```

`ReviewChessApp` owns only theme/router creation. Configure Android `applicationId`/`namespace` as `com.reviewchess.app`, `android:screenOrientation="portrait"`, and display label `ReviewChess`.

- [ ] **Step 5: Verify GREEN and static checks**

```bash
flutter test test/app/app_smoke_test.dart
flutter analyze
flutter build apk --debug
```

Expected: all commands succeed.

- [ ] **Step 6: Commit**

```bash
git add mobile
git commit -m "feat(mobile): scaffold Flutter Android app"
```

---

### Task 2: Add provider URL validation, API configuration, and typed failures

**Files:**
- Create: `mobile/lib/core/sharing/game_url_parser.dart`
- Create: `mobile/lib/core/api/api_config.dart`
- Create: `mobile/lib/core/api/api_failure.dart`
- Create: `mobile/test/core/game_url_parser_test.dart`
- Create: `mobile/test/core/api_config_test.dart`
- Create: `mobile/test/core/api_failure_test.dart`

**Interfaces:**
- Produces: `Uri? extractSupportedGameUri(String text)`.
- Produces: `bool isSupportedGameUri(Uri uri)`.
- Produces: `ApiConfig.fromEnvironment({bool releaseMode = kReleaseMode})` with `baseUri`.
- Produces sealed/immutable `ApiFailure` variants used by repositories/controllers.

- [ ] **Step 1: Write failing URL tests**

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/core/sharing/game_url_parser.dart';

void main() {
  test('accepts Chess.com and Lichess game URLs', () {
    expect(isSupportedGameUri(Uri.parse('https://www.chess.com/game/170804338698')), isTrue);
    expect(isSupportedGameUri(Uri.parse('https://lichess.org/abcdefgh')), isTrue);
  });

  test('rejects deceptive provider suffixes', () {
    expect(isSupportedGameUri(Uri.parse('https://chess.com.attacker.example/game/123')), isFalse);
    expect(isSupportedGameUri(Uri.parse('https://lichess.org.attacker.example/abcdefgh')), isFalse);
  });

  test('extracts first supported URL from shared text', () {
    final uri = extractSupportedGameUri('Review this https://lichess.org/abcdefgh thanks');
    expect(uri.toString(), 'https://lichess.org/abcdefgh');
  });
}
```

- [ ] **Step 2: Run RED**

```bash
flutter test test/core/game_url_parser_test.dart
```

Expected: FAIL because parser functions are missing.

- [ ] **Step 3: Implement strict hostname validation**

```dart
bool _matchesHost(String host, String root) => host == root || host.endsWith('.$root');

bool isSupportedGameUri(Uri uri) {
  if (uri.scheme != 'https' && uri.scheme != 'http') return false;
  final host = uri.host.toLowerCase();
  if (_matchesHost(host, 'lichess.org')) {
    final parts = uri.pathSegments.where((p) => p.isNotEmpty && p != 'analysis' && p != 'white' && p != 'black').toList();
    return parts.isNotEmpty;
  }
  if (_matchesHost(host, 'chess.com')) {
    return uri.pathSegments.any((p) => RegExp(r'^\d{6,}$').hasMatch(p));
  }
  return false;
}

Uri? extractSupportedGameUri(String text) {
  final matches = RegExp(r'https?://[^\s]+').allMatches(text);
  for (final match in matches) {
    final raw = match.group(0)?.replaceAll(RegExp(r'[),.;]+$'), '');
    if (raw == null) continue;
    final uri = Uri.tryParse(raw);
    if (uri != null && isSupportedGameUri(uri)) return uri;
  }
  return null;
}
```

- [ ] **Step 4: Write configuration and failure tests**

Test that debug with no define uses `http://10.0.2.2:8001`, and that release validation rejects missing, non-HTTPS, or localhost base URLs. Test mapping 400/404/429/502/503/504 and connectivity exceptions to the exact `ApiFailure` variants from the spec.

- [ ] **Step 5: Implement `ApiConfig` and `ApiFailure`**

`ApiConfig` must read `const String.fromEnvironment('API_BASE_URL')`; release-mode construction throws `StateError` unless the configured URI uses HTTPS and has a non-localhost host. `ApiFailure.fromStatusCode(int?, {required bool offline})` maps the required status codes deterministically.

- [ ] **Step 6: Verify**

```bash
flutter test test/core/game_url_parser_test.dart test/core/api_config_test.dart test/core/api_failure_test.dart
flutter analyze
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add mobile/lib/core mobile/test/core
git commit -m "feat(mobile): add URL and API safety foundation"
```

---

### Task 3: Add typed backend models and contract fixtures

**Files:**
- Create: `mobile/lib/data/models/game_analysis.dart`
- Create: `mobile/lib/data/models/chesscom_profile.dart`
- Create: `mobile/lib/data/models/app_settings.dart`
- Create generated: `mobile/lib/data/models/*.freezed.dart`
- Create generated: `mobile/lib/data/models/*.g.dart`
- Create: `mobile/test/fixtures/chesscom_analysis.json`
- Create: `mobile/test/fixtures/lichess_analysis.json`
- Create: `mobile/test/fixtures/chesscom_profile.json`
- Create: `mobile/test/fixtures/analysis_optional_fields.json`
- Create: `mobile/test/data/model_contract_test.dart`

**Interfaces:**
- Produces: `GameAnalysis.fromJson(Map<String, dynamic>)`.
- Produces: `GameMove`, `PlayerAccuracy`, `ClassificationCounts`.
- Produces: `ChessComProfile.fromJson`, `ChessComRatings`, `RecentGame`.
- Produces: immutable `AppSettings` with defaults matching the web app: dark theme, wood board, arrows/coordinates/sound enabled, volume `0.8`, autoplay `1000ms`, Stockfish 18, depth 10, max time 5, 3 lines, 1 thread, figurine notation enabled, reduced motion false.

- [ ] **Step 1: Capture deterministic fixtures from the documented backend schema**

Create fixtures containing real field shapes used by the backend, including `white`, `black`, ratings, result, moves with FEN/classification, `accuracy`, and profile `ratings/games`. Include one fixture where optional fields such as avatar, move time, opening data, and evaluation are absent.

- [ ] **Step 2: Write decoding tests before models**

```dart
final analysis = GameAnalysis.fromJson(jsonDecode(fixture) as Map<String, dynamic>);
expect(analysis.moves.first.fen, isNotEmpty);
expect(analysis.moves.first.classification, 'Book');
expect(analysis.accuracy?.white, isA<double>());
```

Also assert malformed required move FEN or notation structures throw a decoding exception rather than being silently accepted.

- [ ] **Step 3: Run RED**

```bash
flutter test test/data/model_contract_test.dart
```

Expected: FAIL because typed models are missing.

- [ ] **Step 4: Implement Freezed/JSON models**

Define `@freezed` data classes with `factory ...fromJson(...) => _$...FromJson(json);`. Required identity fields and FEN stay required; optional backend fields use nullable properties. Use explicit `@JsonKey(name: 'white_rating')`/`black_rating` where backend naming differs from Dart conventions.

- [ ] **Step 5: Generate code and verify fixtures**

```bash
dart run build_runner build --delete-conflicting-outputs
flutter test test/data/model_contract_test.dart
flutter analyze
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add mobile/lib/data mobile/test/data mobile/test/fixtures
git commit -m "feat(mobile): add typed backend contract models"
```

---

### Task 4: Implement local settings, profile snapshot, bookmarks, and recent-URL storage

**Files:**
- Create: `mobile/lib/core/storage/preferences_store.dart`
- Create: `mobile/lib/core/storage/local_cache.dart`
- Create: `mobile/lib/core/storage/storage_providers.dart`
- Create: `mobile/test/core/preferences_store_test.dart`
- Create: `mobile/test/core/local_cache_test.dart`

**Interfaces:**
- Produces: `Future<AppSettings> PreferencesStore.loadSettings()`.
- Produces: `Future<void> PreferencesStore.saveSettings(AppSettings settings)`.
- Produces: `Future<Set<int>> LocalCache.loadBookmarks(String canonicalUrl)` / `saveBookmarks`.
- Produces: cached profile read/write and bounded recent URL list (`max 20`, newest first, deduplicated).
- Never accepts or stores `GameAnalysis`.

- [ ] **Step 1: Write persistence tests with in-memory/test backends**

Test exact default settings, round-trip updated settings, bookmark deduplication/sorting, cached profile round-trip, recent URL deduplication and 20-item cap, and clear/reset operations.

- [ ] **Step 2: Run RED**

```bash
flutter test test/core/preferences_store_test.dart test/core/local_cache_test.dart
```

- [ ] **Step 3: Implement `PreferencesStore`**

Use stable keys prefixed `reviewchess.`. Save scalar settings in one explicit method so settings cannot drift across unrelated widgets.

- [ ] **Step 4: Implement `LocalCache`**

Open named Hive boxes `reviewchess_profile`, `reviewchess_bookmarks`, and `reviewchess_recent`. Store profile as JSON-compatible maps, bookmarks as integer lists keyed by canonical URL, and recent URLs as strings. Do not create any game-analysis box.

- [ ] **Step 5: Verify**

```bash
flutter test test/core/preferences_store_test.dart test/core/local_cache_test.dart
flutter analyze
```

- [ ] **Step 6: Commit**

```bash
git add mobile/lib/core/storage mobile/test/core
git commit -m "feat(mobile): persist lightweight offline state"
```

---

### Task 5: Implement Dio client and repositories for analysis and Chess.com profile/history

**Files:**
- Create: `mobile/lib/core/api/api_client.dart`
- Create: `mobile/lib/features/review/data/game_repository.dart`
- Create: `mobile/lib/features/history/data/profile_repository.dart`
- Create: `mobile/test/features/review/game_repository_test.dart`
- Create: `mobile/test/features/history/profile_repository_test.dart`

**Interfaces:**
- Produces `abstract interface class GameRepository { Future<GameAnalysis> analyzeGame(AnalyzeGameRequest request); }`.
- Produces `AnalyzeGameRequest(url, depth, engine, maxTime, numLines, threads)`.
- Produces `abstract interface class ProfileRepository { Future<ChessComProfile> fetchProfile(String username, {int limit = 20}); }`.
- Repository failures are typed `ApiFailure`, not raw `DioException`.

- [ ] **Step 1: Write repository tests with Dio mock adapters/fake transport**

Verify exact request method/path/body for `/api/analyze`, exact profile path/query, successful model decoding, no automatic retry for analysis, at most one transient retry for profile GET, and status/error mapping.

- [ ] **Step 2: Run RED**

```bash
flutter test test/features/review/game_repository_test.dart test/features/history/profile_repository_test.dart
```

- [ ] **Step 3: Implement `ApiClient`**

Create one Dio instance with `ApiConfig.baseUri`, finite connect/receive timeouts, JSON headers, and debug logging guarded by `kDebugMode`. The release path must not print bodies/URLs through verbose interceptors.

- [ ] **Step 4: Implement repositories**

`DioGameRepository.analyzeGame()` calls `POST /api/analyze` once and decodes `GameAnalysis`. `DioProfileRepository.fetchProfile()` calls `GET /api/chesscom/profile/{encodedUsername}?limit=...`; retry only one transient connectivity failure before surfacing `ApiFailure`.

- [ ] **Step 5: Verify**

```bash
flutter test test/features/review/game_repository_test.dart test/features/history/profile_repository_test.dart
flutter analyze
```

- [ ] **Step 6: Commit**

```bash
git add mobile/lib/core/api mobile/lib/features/review/data mobile/lib/features/history/data mobile/test/features
git commit -m "feat(mobile): connect Flutter repositories to FastAPI"
```

---

### Task 6: Build Review state/controller with navigation, autoplay, flip, bookmarks, and duplicate-submit protection

**Files:**
- Create: `mobile/lib/features/review/presentation/review_state.dart`
- Create: `mobile/lib/features/review/presentation/review_controller.dart`
- Create: `mobile/lib/features/review/presentation/review_providers.dart`
- Create: `mobile/test/features/review/review_controller_test.dart`

**Interfaces:**
- Produces: `ReviewState` with `sourceUrl`, `game`, `currentMoveIndex`, `boardFlipped`, `activeReviewTab`, `autoplayRunning`, `loadingPhase`, `error`, `bookmarks`.
- Produces methods: `analyzeUrl`, `selectMove`, `firstMove`, `previousMove`, `nextMove`, `lastMove`, `startAutoplay`, `stopAutoplay`, `toggleFlip`, `toggleBookmark`, `reset`.
- Consumes `GameRepository`, `LocalCache`, `PreferencesStore`, and strict URL parser.

- [ ] **Step 1: Write controller RED tests**

Cover successful analysis, invalid local URL rejection without repository call, duplicate submit ignored while loading, first/previous/next/last boundaries, autoplay stopping at final move, user navigation cancelling autoplay, flip state, bookmarks restored after analysis and persisted after toggle, and recent URL persistence after successful analysis.

- [ ] **Step 2: Run RED**

```bash
flutter test test/features/review/review_controller_test.dart
```

- [ ] **Step 3: Implement state and controller**

Use Riverpod `Notifier`/`AsyncNotifier` with one authoritative `currentMoveIndex`. The controller must clamp all navigation to `0..game.moves.length`. `analyzeUrl()` validates locally, sets loading once, sends one repository request, restores URL-scoped bookmarks, records recent URL on success, and returns to an error state on failure without retrying silently.

- [ ] **Step 4: Implement deterministic autoplay scheduling**

Inject a `Duration autoplayInterval` or clock/timer abstraction in tests. On each tick, advance one move only if the prior board transition is reported settled by the presentation bridge; stop at the final move. User `selectMove`, previous/next/first/last, reset, or a second accepted analysis cancels the active timer.

- [ ] **Step 5: Verify**

```bash
flutter test test/features/review/review_controller_test.dart
flutter analyze
```

- [ ] **Step 6: Commit**

```bash
git add mobile/lib/features/review/presentation mobile/test/features/review/review_controller_test.dart
git commit -m "feat(mobile): add review state machine"
```

---

### Task 7: Build FEN parser and static custom chessboard with bundled SVG pieces

**Files:**
- Create: `mobile/lib/features/board/domain/board_position.dart`
- Create: `mobile/lib/features/board/domain/board_square.dart`
- Create: `mobile/lib/features/board/presentation/chess_board_view.dart`
- Create: `mobile/lib/features/board/presentation/piece_asset.dart`
- Copy: `frontend/public/pieces_alt/{bB,bK,bN,bP,bQ,bR,wB,wK,wN,wP,wQ,wR}.svg` → `mobile/assets/pieces/`
- Create: `mobile/test/features/board/board_position_test.dart`
- Create: `mobile/test/features/board/chess_board_view_test.dart`

**Interfaces:**
- Produces: `BoardPosition BoardPosition.fromFen(String fen)`.
- Produces: indexed `Map<BoardSquare, BoardPiece>` and side-to-move metadata.
- Produces: `ChessBoardView(position, flipped, showCoordinates, highlights, arrows, reduceMotion)`.

- [ ] **Step 1: Write FEN parser tests**

Use starting-position, castling, en-passant target, promoted-piece, empty-rank, and malformed-FEN cases. Assert exact piece type/color on representative squares and active color/castling/en-passant metadata.

- [ ] **Step 2: Run RED**

```bash
flutter test test/features/board/board_position_test.dart
```

- [ ] **Step 3: Implement the parser**

Parse only the FEN fields the review board needs, but validate all eight ranks expand to exactly eight squares. Represent squares with file/rank values that can map to row/column for both orientations.

- [ ] **Step 4: Write widget tests for board orientation and assets**

Render starting position in normal and flipped orientation; assert `a1`/`h8` coordinate placement and that all 32 pieces render from local SVG assets without network widgets.

- [ ] **Step 5: Implement `ChessBoardView` static layers**

Use `AspectRatio(aspectRatio: 1)` + `Stack`; render square layer, optional coordinates, highlights/arrows, and local `SvgPicture.asset` piece widgets. No piece gesture/drag handlers.

- [ ] **Step 6: Verify**

```bash
flutter test test/features/board/board_position_test.dart test/features/board/chess_board_view_test.dart
flutter analyze
```

- [ ] **Step 7: Commit**

```bash
git add mobile/lib/features/board mobile/assets/pieces mobile/test/features/board mobile/pubspec.yaml
git commit -m "feat(mobile): add custom FEN chessboard"
```

---

### Task 8: Add board move transitions, classification feedback, reduced motion, and sound service

**Files:**
- Create: `mobile/lib/features/board/domain/move_transition.dart`
- Create: `mobile/lib/features/board/presentation/board_motion_controller.dart`
- Create: `mobile/lib/features/board/presentation/classification_feedback.dart`
- Create: `mobile/lib/features/review/presentation/move_sound_service.dart`
- Create/copy: `mobile/assets/sounds/move.wav`, `capture.wav`, `check.wav`, `castle.wav`, `promotion.wav`, `game_end.wav`
- Create: `mobile/test/features/board/move_transition_test.dart`
- Create: `mobile/test/features/board/board_motion_controller_test.dart`
- Create: `mobile/test/features/review/move_sound_service_test.dart`

**Interfaces:**
- Produces: `MoveTransition deriveTransition(BoardPosition before, BoardPosition after, GameMove move)` with types normal/capture/castle/promotion/enPassant/directJump.
- Produces motion phases `idle → moving → landing → verdict → settled`.
- Produces callback/future notifying `ReviewController` when a visual transition settles.
- Sound service accepts move metadata plus settings and never owns move state.

- [ ] **Step 1: Write transition classification tests**

Provide before/after FEN pairs for normal `e2-e4`, capture, both castling directions, promotion, and en passant. Assert exact transition type and source/destination/captured squares.

- [ ] **Step 2: Run RED**

```bash
flutter test test/features/board/move_transition_test.dart
```

- [ ] **Step 3: Implement transition derivation and motion controller**

Sequential moves animate 180–240 ms movement, short landing, then classification feedback, keeping total 250–400 ms. Non-adjacent move-index jumps use `directJump` and a short crossfade/highlight. Starting a new navigation cancels/supersedes the current animation rather than queueing it.

- [ ] **Step 4: Test and implement reduced-motion behavior**

When `reduceMotion == true`, the controller emits target/settled immediately and renders only destination highlight/classification text; no scale, glow, particle, or prolonged translation effect.

- [ ] **Step 5: Test and implement sound selection**

Map move metadata to the six exact local categories. `MoveSoundService.play()` returns immediately when sound is disabled or volume is zero and does not block the board transition future.

- [ ] **Step 6: Verify**

```bash
flutter test test/features/board/move_transition_test.dart test/features/board/board_motion_controller_test.dart test/features/review/move_sound_service_test.dart
flutter analyze
```

- [ ] **Step 7: Commit**

```bash
git add mobile/lib/features/board mobile/lib/features/review/presentation/move_sound_service.dart mobile/assets/sounds mobile/test/features
git commit -m "feat(mobile): animate review moves and feedback"
```

---

### Task 9: Build the complete Review screen, tabs, move story, and persistent seven-button playback dock

**Files:**
- Create: `mobile/lib/features/review/presentation/review_screen.dart`
- Create: `mobile/lib/features/review/presentation/widgets/review_empty_state.dart`
- Create: `mobile/lib/features/review/presentation/widgets/player_bar.dart`
- Create: `mobile/lib/features/review/presentation/widgets/evaluation_bar.dart`
- Create: `mobile/lib/features/review/presentation/widgets/move_story_card.dart`
- Create: `mobile/lib/features/review/presentation/widgets/moves_tab.dart`
- Create: `mobile/lib/features/review/presentation/widgets/analysis_tab.dart`
- Create: `mobile/lib/features/review/presentation/widgets/opening_tab.dart`
- Create: `mobile/lib/features/review/presentation/widgets/playback_dock.dart`
- Create: `mobile/test/features/review/review_screen_test.dart`
- Create: `mobile/test/features/review/playback_dock_test.dart`

**Interfaces:**
- Consumes only Riverpod review state/controller, board widget, and settings providers.
- `PlaybackDock` exposes Share, First, Previous, Play/Pause, Next, Last, Flip in that order and at >=48dp targets.
- Move row tap calls `selectMove(index)`; long press calls `toggleBookmark(index)`.

- [ ] **Step 1: Write Review widget RED tests**

Verify empty state URL field/Analyze button/history shortcut, loading state with disabled duplicate submit, successful board/player/move content, actionable error state, Moves/Analysis/Opening tabs, current move selection, and missing-opening empty state.

- [ ] **Step 2: Write playback dock tests**

Assert all seven controls are always present during review, edge controls disable but remain visible, minimum target size is 48dp, progress displays `Move X / Y`, and Play changes to Pause while autoplay is active.

- [ ] **Step 3: Run RED**

```bash
flutter test test/features/review/review_screen_test.dart test/features/review/playback_dock_test.dart
```

- [ ] **Step 4: Implement the portrait Review composition**

Use `SafeArea`, board-width-first layout, `Expanded` lazy tab content, and playback dock pinned immediately above primary bottom navigation. The move list uses `ListView.builder`; player bars, move story, evaluation, and tabs read selective provider fields so animation ticks do not rebuild the entire screen.

- [ ] **Step 5: Add review gestures and list-scroll policy**

A horizontal swipe on the board area calls previous/next only after a clear directional threshold. No piece dragging and no double-tap flip. When autoplay selects a move, scroll selected row into view only when needed; suppress auto-scroll while the user is actively dragging the move list.

- [ ] **Step 6: Verify classification and reduced-motion presentation**

Add widget assertions that Brilliant/Great/Best/Inaccuracy/Mistake/Miss/Blunder/Book labels map to expected semantic style classes and that reduced motion does not instantiate decorative effect widgets.

- [ ] **Step 7: Verify**

```bash
flutter test test/features/review
flutter analyze
```

- [ ] **Step 8: Commit**

```bash
git add mobile/lib/features/review/presentation mobile/test/features/review
git commit -m "feat(mobile): build full game review experience"
```

---

### Task 10: Build Chess.com profile/history with stale-while-refresh offline behavior

**Files:**
- Create: `mobile/lib/features/history/presentation/history_state.dart`
- Create: `mobile/lib/features/history/presentation/history_controller.dart`
- Create: `mobile/lib/features/history/presentation/history_screen.dart`
- Create: `mobile/lib/features/history/presentation/widgets/profile_header.dart`
- Create: `mobile/lib/features/history/presentation/widgets/recent_game_tile.dart`
- Create: `mobile/test/features/history/history_controller_test.dart`
- Create: `mobile/test/features/history/history_screen_test.dart`

**Interfaces:**
- Consumes `ProfileRepository`, `LocalCache`, and saved username.
- Produces `HistoryState(profile, loading, refreshing, isOfflineSnapshot, error)`.
- Selecting `RecentGame.url` routes to `/review` and calls the same review analysis path.

- [ ] **Step 1: Write controller tests**

Assert cached profile emits before network result, fresh profile replaces cache, failed refresh retains prior cache and marks snapshot offline/stale, no username yields profile-setup state, and refresh limit is 20.

- [ ] **Step 2: Run RED**

```bash
flutter test test/features/history/history_controller_test.dart
```

- [ ] **Step 3: Implement stale-while-refresh controller**

Load local snapshot first, then fetch online. A network failure with cached content sets a visible stale/offline flag instead of clearing the profile. A successful result writes the new snapshot.

- [ ] **Step 4: Write and implement History screen tests/UI**

Verify avatar/username, Rapid/Blitz/Bullet ratings, recent games, refresh action, offline saved-profile banner, profile-setup action, and game selection routing. Use lazy list rendering.

- [ ] **Step 5: Verify**

```bash
flutter test test/features/history
flutter analyze
```

- [ ] **Step 6: Commit**

```bash
git add mobile/lib/features/history/presentation mobile/test/features/history
git commit -m "feat(mobile): add profile and game history"
```

---

### Task 11: Build Settings with immediate persistence and accessibility controls

**Files:**
- Create: `mobile/lib/features/settings/presentation/settings_controller.dart`
- Create: `mobile/lib/features/settings/presentation/settings_screen.dart`
- Create: `mobile/lib/features/settings/presentation/widgets/settings_section.dart`
- Create: `mobile/test/features/settings/settings_controller_test.dart`
- Create: `mobile/test/features/settings/settings_screen_test.dart`

**Interfaces:**
- Consumes/produces `AppSettings` through `PreferencesStore`.
- Exposes profile username, Board, Analysis, Playback, Appearance, Accessibility, and Local Data sections.
- Local Data actions call cache reset APIs; no full-analysis cache action exists.

- [ ] **Step 1: Write settings controller tests**

Test initial load, theme/board/sound/engine/autoplay/reduced-motion changes persisted immediately, reset restores exact defaults, and username changes are normalized/trimmed.

- [ ] **Step 2: Run RED**

```bash
flutter test test/features/settings/settings_controller_test.dart
```

- [ ] **Step 3: Implement controller and screen**

Use typed update methods rather than widgets writing preference keys. Build the exact seven sections from the spec. Theme supports dark/light/system. Engine settings expose engine, depth, max time, lines, threads. Playback exposes autoplay speed, sound enabled/volume/theme and figurine notation. Accessibility includes Reduce Motion.

- [ ] **Step 4: Add local-data actions**

Provide explicit confirmation before clearing profile snapshot/bookmarks/recent URLs or resetting settings. Clearing local data must not make any backend request.

- [ ] **Step 5: Verify widget persistence path**

Use a fake `PreferencesStore`; tap switches/dropdowns, recreate the provider/widget, and assert the persisted values rehydrate correctly.

- [ ] **Step 6: Verify**

```bash
flutter test test/features/settings
flutter analyze
```

- [ ] **Step 7: Commit**

```bash
git add mobile/lib/features/settings mobile/test/features/settings
git commit -m "feat(mobile): add persistent settings"
```

---

### Task 12: Add Android Share Intent and `reviewchess://` deep-link cold/warm flows

**Files:**
- Modify: `mobile/lib/app/router.dart`
- Create: `mobile/lib/core/sharing/share_intent_bridge.dart`
- Create: `mobile/lib/core/sharing/incoming_link_controller.dart`
- Modify: `mobile/android/app/src/main/AndroidManifest.xml`
- Modify: `mobile/android/app/src/main/kotlin/com/reviewchess/app/MainActivity.kt`
- Create: `mobile/test/core/incoming_link_controller_test.dart`
- Create: `mobile/integration_test/deep_link_flow_test.dart`

**Interfaces:**
- Native channel name: `com.reviewchess.app/share`.
- Method `getInitialSharedText` returns cold-start shared text or null.
- Event channel `com.reviewchess.app/shareEvents` emits warm `ACTION_SEND` text.
- `app_links` provides custom URI events.
- All valid incoming URLs call the same `ReviewController.analyzeUrl(uri.toString())` method used by manual entry.

- [ ] **Step 1: Write controller tests for incoming text/links**

Assert valid shared text extracts the first supported game URL, invalid text returns a user-facing `InvalidGameUrl` without repository call, custom URI `reviewchess://review?url=<encoded>` decodes/validates, and warm duplicate delivery of the same intent token does not start two analyses.

- [ ] **Step 2: Run RED**

```bash
flutter test test/core/incoming_link_controller_test.dart
```

- [ ] **Step 3: Implement Kotlin Share Intent bridge**

`MainActivity` stores initial `Intent.ACTION_SEND` `Intent.EXTRA_TEXT`, exposes it over `MethodChannel`, handles `onNewIntent`, and pushes warm share text over `EventChannel`. Do not parse provider URLs in Kotlin; Flutter owns validation.

- [ ] **Step 4: Configure Android manifest**

Add `ACTION_SEND` `text/plain` intent filter and custom deep-link scheme/host for `reviewchess://review`. Keep portrait orientation and exported activity requirements correct. Do not add verified HTTPS app links in V1.

- [ ] **Step 5: Implement Flutter bridge/link controller**

Consume cold and warm Share Intent data plus `app_links` URI stream. Normalize all routes to one validated game URL, navigate to Review, and invoke the existing review controller once.

- [ ] **Step 6: Add cold/warm integration coverage**

Use Flutter integration test hooks or Android instrumentation-compatible invocation to verify initial and warm deep-link routing with fake repository responses. Keep CI deterministic and independent of external Chess.com/Lichess.

- [ ] **Step 7: Verify**

```bash
flutter test test/core/incoming_link_controller_test.dart
flutter test integration_test/deep_link_flow_test.dart
flutter analyze
```

- [ ] **Step 8: Commit**

```bash
git add mobile/lib/app/router.dart mobile/lib/core/sharing mobile/android/app/src/main mobile/test/core mobile/integration_test/deep_link_flow_test.dart
git commit -m "feat(mobile): support shared and deep-linked games"
```

---

### Task 13: Add deterministic end-to-end mobile flows, accessibility checks, and regression coverage

**Files:**
- Create: `mobile/integration_test/review_flow_test.dart`
- Create: `mobile/test/support/fake_game_repository.dart`
- Create: `mobile/test/support/fake_profile_repository.dart`
- Create: `mobile/test/features/review/accessibility_test.dart`
- Create: `mobile/test/features/review/performance_boundary_test.dart`

**Interfaces:**
- Fake repositories decode committed fixtures and never call external providers.
- Integration flows exercise production controllers/widgets with dependency overrides only at repository/network boundaries.

- [ ] **Step 1: Write the primary integration flow**

Cover launch → paste Chess.com URL → Analyze → fixture-backed review appears → next/previous → autoplay to end → flip → bookmark → restart provider scope → bookmark retained.

- [ ] **Step 2: Add settings restart flow**

Change theme/board/sound/autoplay/reduce-motion settings, recreate app state using test persistence, and assert values restore.

- [ ] **Step 3: Add accessibility regression tests**

Measure every playback action with `tester.getSize()` and assert width/height >=48. Use semantics tests for labels on Share/First/Previous/Play/Next/Last/Flip. Enable reduced motion and assert board transition controller settles without decorative effect phases.

- [ ] **Step 4: Add rebuild/performance boundary test**

Instrument board and unrelated settings widgets with counters in test-only wrappers. Advance one move and assert the board/move widgets rebuild while unrelated Settings subtree does not. This protects the architecture requirement that animation ticks do not rebuild the whole app.

- [ ] **Step 5: Run complete Flutter verification**

```bash
cd mobile
dart format --output=none --set-exit-if-changed .
flutter analyze
flutter test
flutter test integration_test/review_flow_test.dart integration_test/deep_link_flow_test.dart
flutter build apk --debug
```

Expected: all commands succeed.

- [ ] **Step 6: Commit**

```bash
git add mobile/integration_test mobile/test
git commit -m "test(mobile): cover Android review workflows"
```

---

### Task 14: Extend CI, release configuration safeguards, and repository documentation

**Files:**
- Modify: `.github/workflows/check.yml`
- Modify: `README.md`
- Create: `mobile/README.md`
- Create: `mobile/test/core/release_config_test.dart`

**Interfaces:**
- Existing `frontend` and `backend` jobs remain unchanged in behavior.
- Adds a `mobile` GitHub Actions job that runs format, analyze, tests, and debug APK build.
- Release configuration requires explicit HTTPS `API_BASE_URL`; signing material is never committed.

- [ ] **Step 1: Add the mobile CI job**

Extend `.github/workflows/check.yml` with a separate job using `subosito/flutter-action@v2` on stable Flutter. Its working directory is `mobile` and steps are exactly:

```yaml
- run: flutter pub get
- run: dart format --output=none --set-exit-if-changed .
- run: flutter analyze
- run: flutter test
- run: flutter build apk --debug
```

Do not remove or weaken existing frontend/backend checks.

- [ ] **Step 2: Add release-config test**

Test the pure config validation path directly: release mode + empty define throws; release mode + `http://...` throws; release mode + `https://api.reviewchess.in` succeeds. Do not require an actual production build to know validation works.

- [ ] **Step 3: Document local Android development**

`mobile/README.md` documents:

```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8001
flutter test
flutter build apk --debug
flutter build appbundle --release --dart-define=API_BASE_URL=https://api.reviewchess.in
```

Also document that the release AAB command requires local/CI signing configuration and that signing files/passwords must not be committed.

- [ ] **Step 4: Update root README project structure**

Add `mobile/` as the Flutter Android client and point to `mobile/README.md`; keep existing web/backend setup intact.

- [ ] **Step 5: Run repository-wide fresh verification**

Mobile:

```bash
cd mobile
dart format --output=none --set-exit-if-changed .
flutter analyze
flutter test
flutter build apk --debug
```

Backend:

```bash
cd backend
python -m py_compile *.py
python -m unittest test_main.py test_chesscom_profile.py -v
```

Frontend:

```bash
cd frontend
npm install
npm run test:unit
npm run lint
npm run build
npx playwright test e2e/mobile-footer.spec.js --config=playwright.config.js
```

Expected: all checks green. If any pre-existing unrelated warning remains non-failing, record it in the PR description rather than masking it.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/check.yml README.md mobile/README.md mobile/test/core/release_config_test.dart
git commit -m "ci: verify Flutter Android client"
```

---

## Final Review Gate Before PR

After Task 14, perform one fresh review against the spec before opening the pull request:

- [ ] Confirm every Definition of Done item in the spec has a passing test or manual build verification.
- [ ] Confirm no `GameAnalysis` persistence exists in Hive/SharedPreferences.
- [ ] Confirm `com.reviewchess.app` is used consistently in Gradle, Kotlin package path, manifest channels, and deep links.
- [ ] Confirm release networking rejects missing/non-HTTPS `API_BASE_URL`.
- [ ] Confirm Share Intent/deep links reject deceptive provider domains.
- [ ] Confirm all seven playback controls remain visible at boundaries and meet 48dp minimum targets.
- [ ] Confirm reduced-motion mode removes decorative effects.
- [ ] Confirm no signing key, password, backend secret, or verbose release HTTP logger is committed.
- [ ] Confirm backend/web tests remain green.
- [ ] Open a PR from the implementation branch to `main` with a summary, screenshots of Review/History/Settings if available, full verification commands/results, and any known non-failing warnings.
