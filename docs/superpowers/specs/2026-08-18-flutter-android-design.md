# ReviewChess Flutter Android App Design

**Date:** 2026-08-18  
**Status:** Approved design, pending final written-spec review  
**Repository:** `mrprohack/chess_rev`  
**Mobile location:** `mobile/`  
**Application ID:** `com.reviewchess.app`  
**Display name:** `ReviewChess`

## 1. Purpose

Build a production-oriented Flutter Android client for the existing ReviewChess web application. The Android app must provide full mobile feature parity for the core review experience while reusing the existing FastAPI backend, Chess.com/Lichess integrations, Stockfish analysis, and server-side game cache.

The Android app is a first-class client, not a WebView wrapper. It must be optimized for portrait phones, touch interaction, smooth chessboard animation, Android sharing, and resilient mobile networking.

## 2. Approved Product Decisions

The approved product constraints are:

- Android only for V1.
- Flutter and Dart for the mobile client.
- The Flutter project lives at `chess_rev/mobile/`.
- Full feature parity with the current mobile-relevant web experience.
- Portrait orientation only.
- Reuse the existing FastAPI backend and Stockfish server analysis.
- Do not run Stockfish on the phone.
- Do not persist full analyzed games to device storage.
- Persist lightweight offline data: settings, Chess.com username/profile snapshot, bookmarks, and recent game URLs.
- Support Android Share Intent for Chess.com and Lichess URLs.
- Support application deep links.
- Use a custom Flutter chessboard rather than embedding the website.
- Keep playback controls persistently available during review.
- Respect reduced-motion accessibility preferences.

## 3. Existing System Context

The current repository contains:

```text
chess_rev/
├── backend/      # FastAPI, Chess.com/Lichess retrieval, PGN parsing, Stockfish, SQLite cache
├── frontend/     # React 19 + Vite web client
└── mobile/       # New Flutter Android client
```

The existing backend remains authoritative for game fetching and analysis. Its main mobile-facing responsibilities are:

- `POST /api/analyze`
- `GET /api/chesscom/profile/{username}`
- Chess.com and Lichess provider access
- Stockfish analysis
- server-side analyzed-game caching

The current server cache remains the only persistent full-analysis cache. The Flutter app may keep the currently opened analysis in memory while the app process remains alive, but it must not persist that full response across launches.

## 4. Architecture

The selected architecture is:

```text
Android UI
   │
   ▼
Riverpod controllers/providers
   │
   ├──────────────► local storage
   │                 ├── settings
   │                 ├── cached profile snapshot
   │                 ├── bookmarks
   │                 └── recent game URLs
   │
   ▼
Repositories
   │
   ▼
Dio API client
   │ HTTPS
   ▼
Existing FastAPI backend
   ├── Chess.com
   ├── Lichess
   ├── Stockfish
   └── server cache/database
```

Widgets must not call Dio, Hive, SharedPreferences, or Android platform APIs directly. UI code talks only to controllers/providers or presentation-facing services.

## 5. Flutter Project Structure

```text
mobile/
├── android/
├── assets/
│   ├── pieces/
│   ├── sounds/
│   └── icons/
├── lib/
│   ├── main.dart
│   ├── app/
│   │   ├── app.dart
│   │   ├── router.dart
│   │   └── theme/
│   ├── core/
│   │   ├── api/
│   │   ├── connectivity/
│   │   ├── sharing/
│   │   ├── storage/
│   │   └── utils/
│   ├── data/
│   │   └── models/
│   └── features/
│       ├── board/
│       ├── review/
│       ├── history/
│       ├── profile/
│       └── settings/
├── test/
└── integration_test/
```

Feature modules should be kept small and independently testable. Networking, local persistence, board rendering, and platform sharing must have explicit boundaries.

## 6. Navigation and Screen Model

The application uses three primary destinations:

1. **Review**
2. **History**
3. **Settings**

Use a native Flutter bottom navigation bar. Review is the default destination.

Profile information is presented in History and Settings rather than as a fourth permanent tab.

### 6.1 Review Screen

The Review screen is the product's primary experience. Its portrait layout is:

```text
App header
Player information
Square chessboard + evaluation indicator
Opponent information
Current move / move story
Moves | Analysis | Opening tabs
Scrollable tab content
Persistent playback dock
Bottom navigation
```

The chessboard should use almost the full available phone width while retaining enough room for a thin evaluation indicator and safe horizontal padding.

### 6.2 Empty Review State

Before a game is loaded:

- show a Chess.com/Lichess URL field;
- show an `Analyze Game` action;
- show a shortcut to recent Chess.com history;
- accept a URL received from Android sharing or deep linking.

A valid shared/deep-linked URL navigates to Review and begins analysis automatically.

### 6.3 History Screen

History shows:

- cached Chess.com profile snapshot immediately when available;
- username, avatar, and Rapid/Blitz/Bullet ratings;
- recent Chess.com games from the backend;
- refresh action;
- clear online/offline state.

Selecting a game routes to Review and analyzes that game URL.

### 6.4 Settings Screen

Settings is a full page, not a modal. Sections are:

- Profile
- Board
- Analysis
- Playback
- Appearance
- Accessibility
- Local Data

## 7. Review Playback Controls

The persistent playback dock uses seven actions:

```text
Share | First | Previous | Play/Pause | Next | Last | Flip
```

Requirements:

- controls stay visible while a game is being reviewed;
- center Play/Pause receives strongest visual emphasis;
- touch targets are at least 48x48 dp;
- First/Previous remain visible but disabled at the beginning;
- Next/Last remain visible but disabled at the end;
- autoplay stops automatically on the final move;
- a progress row shows `Move X / Y` and key-moment count.

## 8. Review Tabs

### 8.1 Moves

Use a lazily rendered move list. Each move can show:

- move number;
- SAN/figurine notation;
- classification;
- time/evaluation when present;
- current selection;
- key-moment state;
- bookmark state.

Tapping a move selects it. Long-press toggles bookmark state.

### 8.2 Analysis

Display a phone-friendly game summary including accuracy and classification counts for both players. Do not force a desktop-style wide table onto mobile.

### 8.3 Opening

Display opening name, variation, ECO code, and opening move sequence when supplied by the analysis response. When opening information is absent, show a deliberate empty state.

## 9. Move Story

The current move gets a compact story card showing the most relevant explanation and engine context. The collapsed card should prioritize classification, move notation, and short explanation. An expanded state may show evaluation change, best move, bookmark action, and previous/next key-moment navigation.

The move story must use the same authoritative `currentMoveIndex` as the board, list selection, evaluation, and playback dock.

## 10. State Management

Use Riverpod for application state.

### 10.1 Review State

Conceptual state:

```text
ReviewState
├── sourceUrl
├── game
├── currentMoveIndex
├── boardFlipped
├── activeReviewTab
├── autoplayRunning
├── loadingPhase
├── error
└── bookmarks
```

`currentMoveIndex` is the single source of truth for:

- board position;
- highlighted move;
- move story;
- evaluation;
- classification;
- sound;
- progress count.

No widget or sub-feature may maintain an independent authoritative move index.

### 10.2 Review Controller

The controller exposes operations equivalent to:

- analyze URL;
- load shared URL;
- select move;
- first/previous/next/last;
- start/stop autoplay;
- flip board;
- toggle bookmark;
- reset review.

### 10.3 Profile and Settings State

Profile and settings use separate providers/controllers. Profile can emit cached data first and then refresh online. Settings update local persistence immediately.

## 11. Data Models

The Flutter client uses typed models for backend responses. Core models include:

- `GameAnalysis`
- `GameMove`
- `PlayerAccuracy`
- `ClassificationCounts`
- `ChessComProfile`
- `ChessComRatings`
- `RecentGame`
- `AppSettings`

Model decoding must tolerate backend fields that are optional today while rejecting structurally invalid required fields.

Use `freezed` for immutable model/state types and `json_serializable` for generated JSON decoding/encoding. Generated code must remain reproducible from source and checked by CI through normal analyze/test/build steps.

## 12. API Layer

Use Dio behind repositories.

Primary repository operations:

- analyze game;
- fetch Chess.com profile/history.

The analyze request supports the existing engine configuration:

- URL
- depth
- engine
- maximum analysis time
- number of lines
- threads

### 12.1 API Base URL

Do not hardcode the production backend hostname in source files.

Use a compile-time configuration value:

```text
API_BASE_URL
```

Debug Android-emulator builds may default to `http://10.0.2.2:8001`. Release builds must be given an explicit HTTPS `API_BASE_URL` using Flutter build configuration such as `--dart-define`.

A release build without a valid HTTPS API base URL must fail configuration validation rather than silently fall back to localhost or cleartext HTTP.

## 13. Networking and Retry Policy

Dio handles:

- connection timeout;
- response timeout;
- debug-only request logging;
- status-code normalization;
- typed error mapping.

Retry policy:

- profile/history GET operations may perform at most one automatic retry for transient connectivity failures;
- `POST /api/analyze` is never silently retried because analysis may be expensive;
- failed analysis shows a user-controlled Retry action.

Duplicate Analyze submissions must be disabled while a request is active.

## 14. Error Model

Map backend/network failures into typed application failures. The UI must not parse raw HTTP error strings.

At minimum:

| Condition | App failure |
|---|---|
| invalid URL/request | `InvalidGameUrl` / `InvalidAnalysisRequest` |
| missing game/profile | `NotFoundFailure` |
| provider rate limit | `RateLimitedFailure` |
| provider unavailable | `ProviderUnavailableFailure` |
| engine unavailable | `EngineUnavailableFailure` |
| timeout | `RequestTimedOutFailure` |
| no network | `OfflineFailure` |
| unexpected response | `UnknownFailure` |

Errors must produce actionable states such as Edit Link, Retry, or Go Back.

## 15. Local Storage

The app intentionally stores only lightweight data.

### 15.1 SharedPreferences

Store simple preferences:

- theme;
- board theme;
- coordinates;
- arrows;
- sound enabled;
- sound volume;
- sound theme;
- autoplay speed;
- figurine notation;
- engine;
- engine depth;
- maximum analysis time;
- lines;
- threads;
- reduce motion;
- Chess.com username.

### 15.2 Hive

Store structured lightweight state:

- cached Chess.com profile snapshot;
- bookmarks keyed by canonical game URL;
- recent game URLs;
- last opened game URL.

Do not store full `GameAnalysis` payloads in Hive or SharedPreferences.

### 15.3 Offline Behavior

Available offline:

- application launch;
- settings;
- themes and board preferences;
- sound/autoplay preferences;
- engine preferences;
- cached Chess.com profile snapshot;
- bookmarks;
- recent game URLs.

Requires network/backend:

- new game analysis;
- fresh profile;
- fresh history;
- reopening a full reviewed game after process restart.

If the currently analyzed game remains in process memory, it can continue to be reviewed after connectivity drops until the process is killed or the review is replaced.

## 16. Profile Cache Strategy

History uses stale-while-refresh behavior:

1. load cached profile snapshot immediately;
2. render it when available;
3. request fresh profile/history from the backend;
4. replace the snapshot after a successful response;
5. retain the last good snapshot after a refresh failure.

Offline UI must label cached information clearly rather than implying it is current.

## 17. Android Share Intent

Support Android `ACTION_SEND` text sharing.

The native Android layer receives shared text and passes it to Flutter through a small platform channel owned by this app. The Flutter sharing service extracts the first valid supported game URL, validates the hostname, then routes the URL through the same Review controller used by manual URL entry.

Accepted provider hosts are exact Chess.com/Lichess domains or their legitimate subdomains. Deceptive hosts such as `chess.com.attacker.example` and `lichess.org.attacker.example` must be rejected.

Flow:

```text
Chess.com/Lichess
  → Share
  → ReviewChess
  → extract + validate URL
  → Review route
  → analyze
```

If no valid game URL is present, show a concise error and do not call the backend.

## 18. Deep Links

Use `go_router` for route handling and `app_links` for incoming application links.

Support the custom application link form:

```text
reviewchess://review?url=<encoded-game-url>
```

The design also permits verified HTTPS app links under a ReviewChess-owned domain later, without changing the internal review pipeline. Verified HTTPS app links themselves are not required for V1.

Both cold-start and warm-start custom deep-link paths must be tested.

## 19. Chessboard Architecture

Build a custom Flutter review chessboard using a layered `Stack` model:

```text
ChessBoardView
├── 64-square board layer
├── coordinate layer
├── square-highlight layer
├── arrow layer
├── static-piece layer
├── moving-piece layer
└── classification/effect layer
```

Reuse the current repository SVG chess piece set as bundled local assets. If direct Flutter SVG loading requires asset conversion, convert the same artwork into a Flutter-compatible bundled representation without changing the visual piece set. Do not load piece artwork over the network during normal review.

The board is a review surface, not a gameplay input surface. V1 does not support drag-to-play pieces.

## 20. Board Position and FEN

Use the backend-provided FEN for direct position selection.

When the user jumps from one distant move to another, render the target FEN directly using a short crossfade/highlight rather than replaying every intermediate move.

For sequential transitions, compare previous position, played move metadata, and target position to determine the appropriate animation.

The board renderer must correctly handle:

- normal movement;
- capture;
- castling;
- promotion;
- en passant;
- board flip;
- starting position;
- direct move jumps.

## 21. Animation State Machine

Use one move-transition state machine:

```text
idle → moving → landing → verdict → settled
```

Typical total transition time is approximately 250–400 ms.

The autoplay controller advances only after the current move transition is settled. New user navigation cancels or supersedes an in-progress transition so animations cannot queue indefinitely.

Reduced-motion mode skips decorative movement/effects and updates to the target position immediately with simple square highlighting and classification text.

## 22. Classification Feedback

Supported classifications include:

- Brilliant
- Great
- Best
- Excellent
- Good
- Inaccuracy
- Mistake
- Miss
- Blunder
- Book

Prominent visual effects are reserved for important classifications. Effects must remain short and must not obscure pieces or block interaction.

## 23. Touch Interaction

V1 board/review gestures are intentionally limited:

- swipe left: next move;
- swipe right: previous move;
- long-press a move row: toggle bookmark;
- piece dragging: disabled;
- board double-tap/gesture flip: not included in V1.

The persistent Flip button is the single discoverable way to flip the board in V1.

## 24. Sound

Move sounds are bundled local assets and must not block rendering.

V1 sound categories are:

- normal move;
- capture;
- check;
- castle;
- promotion;
- game end.

Sound behavior is controlled by enabled state, volume, and sound theme. Respect platform audio behavior and user mute/silent expectations.

## 25. Performance Requirements

Targets:

- smooth 60 FPS normal UI and board transitions on typical mid-range Android hardware;
- local move navigation response under 100 ms excluding animation duration;
- near-instant tab changes;
- target cold start under approximately 2.5 seconds on typical supported hardware;
- no unnecessary network-loaded board assets;
- lazy rendering for long move lists;
- avoid rebuilding the full Review screen on every animation frame.

Use Riverpod selection and widget boundaries so state changes rebuild only the affected subtrees.

## 26. Move List Scrolling

Use lazy list rendering. When the selected move changes through buttons or autoplay, keep the selected move reasonably visible.

Manual user scrolling temporarily takes priority. Autoplay must not aggressively force-scroll the list on every tick while the user is actively interacting with it.

## 27. Portrait-Only Android Configuration

V1 locks Android orientation to portrait.

Required Android configuration includes:

- internet permission;
- portrait orientation;
- `ACTION_SEND` intent handling;
- custom deep-link handling;
- adaptive launcher icon;
- splash screen;
- release signing configuration.

Target/compile SDK versions will be set during implementation to the current Google Play-supported requirements and must not be frozen in this design document.

## 28. Security

Security rules:

- production API traffic is HTTPS only;
- no backend secrets are bundled into the APK;
- release builds do not emit verbose HTTP debug logs;
- only supported Chess.com/Lichess game URLs are accepted for automatic analysis;
- deceptive provider hostnames are rejected locally and remain rejected by the backend;
- signing credentials are never committed;
- the app stores no Chess.com password or other provider credentials;
- Stockfish remains server-side.

The approved local data is low sensitivity. Standard application-local storage is acceptable for V1. Any future authentication token must use secure platform storage rather than Hive or SharedPreferences.

## 29. Testing Strategy

### 29.1 Unit Tests

Cover at least:

- URL validation;
- Chess.com URL extraction;
- Lichess URL extraction;
- deceptive-host rejection;
- shared-text URL extraction;
- FEN parsing;
- board orientation;
- move navigation boundaries;
- bookmark logic;
- classification mapping;
- settings serialization/persistence;
- API error mapping.

### 29.2 Controller Tests

Cover at least:

- analysis success;
- analysis error;
- duplicate-submit prevention;
- first/previous/next/last;
- autoplay completion and cancellation;
- board flip;
- bookmark restoration;
- cached profile then refresh;
- offline profile state;
- Share Intent to analysis;
- deep link to analysis.

### 29.3 Widget Tests

Cover at least:

- Review empty state;
- analyzing state;
- review success state;
- error states;
- move selection;
- playback controls;
- minimum touch-target sizing;
- History cached/offline UI;
- Settings persistence UI;
- classification presentation;
- reduced-motion behavior.

### 29.4 Integration Tests

Cover Android flows including:

- launch → paste URL → analyze → review → navigate moves;
- autoplay → final move;
- bookmark → restart → bookmark retained;
- settings → restart → settings retained;
- Android Share Intent → Review → analyze;
- deep-link cold start;
- deep-link warm start.

Use a deterministic test backend or mocked HTTP layer for CI mobile integration tests so they do not depend on external Chess.com/Lichess availability.

## 30. API Contract Protection

Maintain representative backend JSON fixtures for:

- Chess.com analysis;
- Lichess analysis;
- profile/history;
- optional/missing fields;
- known error responses.

Flutter model tests must decode these fixtures. Where practical, CI should include a small contract check that prevents backend response changes from silently breaking the mobile client.

## 31. CI

Extend the repository's existing GitHub Actions checks with a Flutter Android job.

Required mobile checks:

```text
flutter pub get
dart format --output=none --set-exit-if-changed .
flutter analyze
flutter test
flutter build apk --debug
```

Existing backend and web jobs remain required and must continue to pass.

A later release workflow may produce a signed Android App Bundle. Signing secrets must live only in the CI secret store or secure release environment.

## 32. Release Model

Development uses normal Flutter debug builds.

Release progression:

1. debug APK for development;
2. internal release APK for device testing;
3. signed Android App Bundle for Google Play.

The permanent Android package identifier is `com.reviewchess.app`.

Production release builds require an explicit HTTPS API base URL and signing configuration.

## 33. Definition of Done

Flutter Android V1 is complete only when all of the following are true:

- Chess.com and Lichess analysis works through the existing backend;
- board correctly renders all backend FEN positions;
- normal/capture/castle/promotion/en-passant transitions behave correctly;
- first/previous/play/next/last/flip controls work;
- moves, classifications, bookmarks, and selected state stay synchronized;
- History loads Chess.com recent games;
- Profile supports online refresh and offline snapshot display;
- Settings persist across launches;
- Bookmarks persist across launches;
- Android Share Intent works;
- custom deep-link cold and warm launches work;
- approved lightweight data remains accessible offline;
- offline/provider/rate-limit/timeout/server errors are handled deliberately;
- touch targets and reduced-motion behavior meet the approved requirements;
- Flutter format, analyze, unit/widget tests, and integration tests are green;
- debug APK builds in CI;
- existing backend and web test suites remain green.

## 34. Explicit Non-Goals for V1

The following are not part of this implementation unless separately approved later:

- iOS build/release;
- WebView-based mobile wrapper;
- on-device Stockfish analysis;
- full analyzed-game offline persistence;
- user accounts/authentication owned by ReviewChess;
- playing/editing moves by dragging chess pieces;
- board double-tap/gesture flip;
- verified HTTPS Android App Links;
- push notifications;
- cloud bookmark synchronization;
- subscriptions/payments;
- landscape/tablet-specific layouts;
- unrelated refactoring of the existing React frontend or FastAPI backend.

## 35. Implementation Principle

The Android client should improve mobile usability without changing the backend's core responsibility. Manual URL entry, History selection, Android Share Intent, and custom deep links must all converge on the same validated review-analysis pipeline.

The implementation should proceed feature-by-feature with tests written alongside behavior, preserving green backend/web CI throughout the mobile build.