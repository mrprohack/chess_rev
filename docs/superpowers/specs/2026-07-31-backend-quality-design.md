# Backend Quality and Performance Design

## Goal

Improve the FastAPI backend's clarity, error handling, performance, and reliability while preserving the frontend request fields and successful response JSON.

## Scope

The change is limited to backend internals and focused backend tests. It does not change the frontend, add dependencies, introduce a new database schema, or redesign move classification.

## Approach

Keep the backend small and refactor `backend/main.py` in place. Introduce short, named helpers for URL parsing, provider fetching, cache-key generation, and Stockfish evaluation. Retain `backend/database.py` as the existing SQLite persistence layer and expand `backend/test_main.py` with standard-library `unittest` tests and mocks.

This is preferred over adding provider and service modules because the current backend is small enough to remain understandable in one API file once the long route and analysis loop are decomposed.

## Request and Response Compatibility

`POST /api/analyze` continues to accept:

- `url`
- `depth`
- `engine`
- `maxTime`
- `numLines`
- `threads`

Successful responses retain the existing player, result, timing, moves, classification counts, and accuracy fields. Existing frontend code therefore requires no change.

Invalid numeric settings are rejected by Pydantic validation instead of being silently coerced into unsafe or unexpectedly expensive values. Provider and engine failures continue to use FastAPI's `{"detail": "..."}` error shape.

## Components

### Request validation

Use Pydantic field constraints for:

- non-empty URL
- depth from 1 through 30
- maximum time from 0 through 60 seconds
- number of lines from 1 through 5
- threads from 1 through 32

Keep existing engine names accepted so the frontend contract remains intact. An engine value of `off` disables analysis. Values containing `lite` continue to request Stockfish without NNUE; other current frontend engine labels continue to use the installed Stockfish binary rather than breaking existing selections.

### URL parsing

Parse URLs with `urllib.parse.urlparse`. Accept HTTPS or HTTP URLs whose normalized hostname is exactly `chess.com`, a Chess.com subdomain, `lichess.org`, or a Lichess subdomain. Extract game identifiers from supported path forms and reject malformed paths with a `400` response.

This replaces substring checks such as `"chess.com" in url`, which can accept unrelated or deceptive hosts.

### Provider fetching

Use one `requests.Session` during each uncached request so Chess.com's callback and archive requests can reuse a connection. Keep provider-specific fetching in small helpers:

- Lichess: fetch the direct PGN export.
- Chess.com: fetch callback metadata, locate the monthly archive, and select the matching PGN.

Helpers return PGN text or raise a small backend exception carrying a safe HTTP status and message. They do not expose raw provider response bodies or internal exception text.

### Stockfish lifecycle and analysis

Keep one Stockfish process per analysis request and always close it in `finally`. If Stockfish cannot start or fails during analysis, raise a clear service error instead of silently returning zero evaluations as if analysis succeeded.

Evaluate the initial board once. After each move, evaluate the resulting board once and reuse that result as the next move's pre-move evaluation. For a game with `N` plies, this reduces engine evaluations from approximately `2N` to `N+1` without changing classification inputs.

The `numLines` request field remains accepted for compatibility, but the backend continues returning only the single best move used by the existing response schema. It must not configure Stockfish's managed `MultiPV` option directly.

### FastAPI execution

Define the analysis endpoint as a normal synchronous function. FastAPI runs synchronous handlers in its worker thread pool, preventing blocking `requests` and Stockfish calls from freezing the application's async event loop.

### Cache behavior

Build a deterministic cache key from every setting that can affect the stored result:

- analysis format version
- depth
- engine
- maximum time
- number of lines
- threads

Store this key in the existing `GameRecord.depth` string column. This avoids a schema migration and prevents requests with different settings from incorrectly sharing cached analysis. Existing legacy cache rows are ignored; they do not need to be deleted.

Commit the database transaction only after a complete analysis result exists. Roll back if persistence fails, then return a safe internal error.

## Error Handling

Return stable, actionable errors:

- `400`: unsupported provider, malformed URL, or missing game identifier
- `404`: provider confirms that the game does not exist or the PGN cannot be found
- `422`: provider returned content that is not a readable chess game
- `502`: provider connection failure or unexpected provider HTTP failure
- `504`: provider request timeout
- `503`: Stockfish is unavailable or fails during analysis
- `500`: unexpected internal or database failure

Use Python's `logging` module for diagnostic details and stack traces. Client messages must not contain raw exception strings, filesystem paths, provider response bodies, or database details.

## Testing

Expand `backend/test_main.py` using `unittest` and `unittest.mock`; do not add a test framework.

Tests cover:

- valid and deceptive provider URLs
- malformed provider paths
- request-bound validation
- Lichess and Chess.com not-found responses
- timeout and connection error mapping
- safe unexpected-error responses
- cache keys changing when analysis settings change
- cached responses bypassing provider and Stockfish work
- Stockfish cleanup after success and failure
- a short PGN using `N+1` engine evaluations rather than `2N`
- successful response field compatibility

All network, engine, and database-sensitive paths in unit tests use mocks or temporary state so the suite does not depend on live chess providers.

## Verification

Run:

```powershell
backend\venv\Scripts\python.exe -m unittest discover -s backend -p "test_main.py" -v
backend\venv\Scripts\python.exe -m compileall -q backend
```

The first command must pass without external network access. The second must complete with exit code zero.

## Deliberate Omissions

- No new caching service or dependency; SQLite remains sufficient.
- No shared Stockfish process pool; add one only if measured concurrent load justifies its lifecycle complexity.
- No database migration; the existing string cache-key column can hold the versioned settings key.
- No provider retry loop; retries can multiply provider rate-limit pressure and request latency.
- No frontend changes or new response fields.
