# ReviewChess Android

Flutter Android client for the ReviewChess FastAPI/Stockfish backend.

## Requirements

- Flutter stable
- Android SDK / Android Studio or a configured Android device/emulator
- ReviewChess backend running locally or reachable over HTTPS

## First-time Android scaffold

The repository keeps the Flutter application source plus deterministic Android templates. If `mobile/android/` is not present in your checkout, generate it once with:

```bash
cd mobile
bash tool/bootstrap_android.sh
```

The script creates the Android platform with Flutter, then applies the permanent package ID `com.reviewchess.app`, portrait configuration, Share Intent receiver, and `reviewchess://review` deep-link configuration.

## Development

```bash
cd mobile
flutter pub get
bash tool/bootstrap_android.sh
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8001
```

`10.0.2.2` is the Android emulator route to a backend running on the development machine. A physical phone needs a reachable LAN/HTTPS backend URL instead.

## Quality checks

```bash
cd mobile
dart format --output=none --set-exit-if-changed .
flutter analyze
flutter test
bash tool/bootstrap_android.sh
flutter build apk --debug
```

The repository CI also keeps the existing backend and React web checks green.

## Production API configuration

Release builds never fall back to localhost or cleartext HTTP. Supply an explicit HTTPS endpoint:

```bash
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://api.reviewchess.in
```

A missing, local, or non-HTTPS `API_BASE_URL` is rejected by release configuration validation.

## Release signing

Google Play release signing is intentionally not stored in Git. Configure the Android signing key and passwords locally or through CI secrets before producing a publishable AAB. Never commit keystores, passwords, backend secrets, or provider credentials.

## Android links and sharing

ReviewChess accepts:

- Android `ACTION_SEND` text shares containing a valid Chess.com or Lichess game URL.
- Custom deep links such as:

```text
reviewchess://review?url=https%3A%2F%2Flichess.org%2Fabcdefgh
```

Incoming URLs are validated before analysis; deceptive provider hosts such as `chess.com.attacker.example` are rejected.

## Offline behavior

Available offline after it has been saved locally:

- settings and theme
- Chess.com username/profile snapshot
- bookmarks
- recent game URLs

Fresh profile/history requests and new Stockfish analysis require the backend. Full analyzed games are not persisted across application restarts.
