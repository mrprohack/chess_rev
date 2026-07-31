# Backend Quality and Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing FastAPI backend clearer, safer, and faster without changing the frontend request fields or successful response JSON.

**Architecture:** Keep the implementation in `backend/main.py`, but replace the long endpoint with small functions for URL parsing, provider fetching, cache-key creation, and engine evaluation. Keep SQLite unchanged, execute the blocking route in FastAPI's worker pool, and verify behavior through the existing standard-library test module.

**Tech Stack:** Python, FastAPI, Pydantic, requests, python-chess, SQLAlchemy, unittest

## Global Constraints

- Preserve the `POST /api/analyze` request field names and successful response structure.
- Do not change frontend files.
- Do not add dependencies or migrate the database.
- Keep Stockfish's existing platform-specific binary lookup and automatic installation behavior.
- Use `backend/venv/Scripts/python.exe` for tests and verification.
- Never expose raw exception text, provider bodies, database details, or filesystem paths to API clients.

---

## File Map

- Modify `backend/main.py`: request validation, URL parsing, provider retrieval, cache-key construction, Stockfish lifecycle, optimized analysis loop, endpoint orchestration, and safe error mapping.
- Modify `backend/test_main.py`: isolated regression tests for validation, parsing, errors, caching, engine cleanup, evaluation count, and response compatibility.

### Task 1: Validate Requests and Parse Provider URLs Safely

**Files:**
- Modify: `backend/test_main.py`
- Modify: `backend/main.py`

**Interfaces:**
- Produces: `parse_game_url(raw_url: str) -> tuple[str, str]`
- Produces: constrained `AnalyzeRequest` fields used by Tasks 2 and 3

- [ ] **Step 1: Write failing URL and request-validation tests**

Add tests that name the breaks they catch:

```python
class TestRequestValidation(unittest.TestCase):
    def test_rejects_depth_above_supported_limit(self):
        response = client.post(
            "/api/analyze",
            json={"url": "https://lichess.org/abcdefgh", "depth": 31},
        )
        self.assertEqual(response.status_code, 422)

    def test_rejects_zero_threads(self):
        response = client.post(
            "/api/analyze",
            json={"url": "https://lichess.org/abcdefgh", "threads": 0},
        )
        self.assertEqual(response.status_code, 422)


class TestGameUrlParsing(unittest.TestCase):
    def test_parses_lichess_game_id(self):
        self.assertEqual(
            parse_game_url("https://lichess.org/abcdefgh?foo=bar"),
            ("lichess", "abcdefgh"),
        )

    def test_parses_chess_com_live_game_id(self):
        self.assertEqual(
            parse_game_url("https://www.chess.com/game/live/170804338698"),
            ("chess.com", "170804338698"),
        )

    def test_rejects_deceptive_provider_hostname(self):
        with self.assertRaises(HTTPException) as caught:
            parse_game_url("https://chess.com.attacker.example/game/live/123")
        self.assertEqual(caught.exception.status_code, 400)

    def test_rejects_chess_com_path_without_game_id(self):
        with self.assertRaises(HTTPException) as caught:
            parse_game_url("https://www.chess.com/game/live/")
        self.assertEqual(caught.exception.status_code, 400)
```

Import `HTTPException` and `parse_game_url` in the test module.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```powershell
venv\Scripts\python.exe -m unittest test_main.TestRequestValidation test_main.TestGameUrlParsing -v
```

Working directory: `backend`

Expected: tests fail because request fields are unconstrained and `parse_game_url` does not exist.

- [ ] **Step 3: Add constrained fields and the minimal URL parser**

In `backend/main.py`, import `Field` and `urlparse`, then define:

```python
class AnalyzeRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    depth: int = Field(default=10, ge=1, le=30)
    engine: str = Field(default="stockfish18", min_length=1, max_length=32)
    maxTime: int = Field(default=5, ge=0, le=60)
    numLines: int = Field(default=3, ge=1, le=5)
    threads: int = Field(default=1, ge=1, le=32)


def parse_game_url(raw_url: str) -> tuple[str, str]:
    parsed = urlparse(raw_url.strip())
    host = (parsed.hostname or "").lower()
    parts = [part for part in parsed.path.split("/") if part]

    if parsed.scheme not in {"http", "https"}:
        raise HTTPException(status_code=400, detail="Invalid game URL")

    if host == "lichess.org" or host.endswith(".lichess.org"):
        if not parts:
            raise HTTPException(status_code=400, detail="Could not extract Lichess game ID")
        return "lichess", parts[0]

    if host == "chess.com" or host.endswith(".chess.com"):
        for game_type in ("live", "daily"):
            if game_type in parts:
                index = parts.index(game_type) + 1
                if index < len(parts):
                    return "chess.com", parts[index]
        raise HTTPException(status_code=400, detail="Could not extract Chess.com game ID")

    raise HTTPException(
        status_code=400,
        detail="Invalid URL. Must be chess.com or lichess.org",
    )
```

- [ ] **Step 4: Run focused and existing tests and verify GREEN**

Run:

```powershell
venv\Scripts\python.exe -m unittest test_main.TestRequestValidation test_main.TestGameUrlParsing -v
venv\Scripts\python.exe -m unittest test_main -v
```

Working directory: `backend`

Expected: all Task 1 and existing tests pass.

- [ ] **Step 5: Commit Task 1**

```powershell
git add backend/main.py backend/test_main.py
git commit -m "refactor: validate backend analysis requests"
```

### Task 2: Make Stockfish Fail Clearly and Analyze Each Position Once

**Files:**
- Modify: `backend/test_main.py`
- Modify: `backend/main.py`

**Interfaces:**
- Consumes: validated `AnalyzeRequest` values from Task 1
- Produces: `EngineUnavailableError`
- Produces: `parse_pgn(pgn_str: str, engine_depth: int = 10, engine_id: str = "stockfish18", max_time: int = 5, num_lines: int = 3, threads: int = 1) -> dict`

- [ ] **Step 1: Write failing evaluation-count and cleanup tests**

Add a minimal fake engine whose evaluations use real python-chess score objects:

```python
class FakeEngine:
    def __init__(self, fail_after=None):
        self.analysis_count = 0
        self.fail_after = fail_after
        self.closed = False

    def configure(self, options):
        return None

    def analyse(self, board, limit):
        self.analysis_count += 1
        if self.fail_after is not None and self.analysis_count > self.fail_after:
            raise chess.engine.EngineError("engine stopped")
        return {
            "score": chess.engine.PovScore(chess.engine.Cp(0), chess.WHITE),
            "pv": [next(iter(board.legal_moves))],
        }

    def quit(self):
        self.closed = True


class TestPgnAnalysis(unittest.TestCase):
    short_pgn = """[White "Alice"]
[Black "Bob"]
[Result "*"]

1. e4 e5 *
"""

    def test_analyzes_each_position_once(self):
        engine = FakeEngine()
        with patch("main.chess.engine.SimpleEngine.popen_uci", return_value=engine):
            result = parse_pgn(self.short_pgn)
        self.assertEqual(len(result["moves"]), 2)
        self.assertEqual(engine.analysis_count, 3)
        self.assertTrue(engine.closed)

    def test_closes_engine_when_analysis_fails(self):
        engine = FakeEngine(fail_after=1)
        with patch("main.chess.engine.SimpleEngine.popen_uci", return_value=engine):
            with self.assertRaises(EngineUnavailableError):
                parse_pgn(self.short_pgn)
        self.assertTrue(engine.closed)
```

Import `chess`, `patch`, `EngineUnavailableError`, and `parse_pgn`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```powershell
venv\Scripts\python.exe -m unittest test_main.TestPgnAnalysis -v
```

Working directory: `backend`

Expected: the first test observes four analyses rather than three, and the failure test receives the raw engine exception rather than `EngineUnavailableError`.

- [ ] **Step 3: Implement one-evaluation-per-position and explicit engine failure**

Add:

```python
class EngineUnavailableError(RuntimeError):
    pass


def analyse_position(engine, board, limit):
    try:
        return engine.analyse(board, limit)
    except (chess.engine.EngineError, OSError) as exc:
        raise EngineUnavailableError("Chess engine unavailable") from exc
```

In `parse_pgn`, do not configure the managed `MultiPV` option. Configure only `Threads` and optional `Use NNUE`. After opening the engine, calculate one `current_info` for the initial board. In each loop:

```python
score_before = score_from_info(current_info)
best_move_uci = best_move_from_info(current_info)

next_node = node.variation(0)
move = next_node.move
san_move = board.san(move)
played_move_uci = move.uci()
board.push(move)

next_info = analyse_position(engine, board, limit) if engine else None
score_after = score_from_info(next_info)
```

After appending the move, assign `current_info = next_info`. Wrap both engine startup and analysis failures as `EngineUnavailableError`, and retain `engine.quit()` in `finally`.

Add small helpers:

```python
def score_from_info(info):
    if not info:
        return 0
    return info["score"].white().score(mate_score=10000) or 0


def best_move_from_info(info):
    pv = info.get("pv", []) if info else []
    return pv[0].uci() if pv else None
```

- [ ] **Step 4: Run focused and full backend tests and verify GREEN**

Run:

```powershell
venv\Scripts\python.exe -m unittest test_main.TestPgnAnalysis -v
venv\Scripts\python.exe -m unittest test_main -v
```

Working directory: `backend`

Expected: all tests pass; the two-ply fixture performs exactly three engine analyses and closes the engine.

- [ ] **Step 5: Commit Task 2**

```powershell
git add backend/main.py backend/test_main.py
git commit -m "perf: reuse stockfish position evaluations"
```

### Task 3: Isolate Provider Fetching, Correct Cache Keys, and Sanitize Errors

**Files:**
- Modify: `backend/test_main.py`
- Modify: `backend/main.py`

**Interfaces:**
- Consumes: `parse_game_url()` from Task 1
- Consumes: `EngineUnavailableError` and `parse_pgn()` from Task 2
- Produces: `build_cache_key(req: AnalyzeRequest) -> str`
- Produces: `fetch_lichess_pgn(session: requests.Session, game_id: str) -> str`
- Produces: `fetch_chess_com_pgn(session: requests.Session, game_id: str) -> str`
- Produces: synchronous `analyze_game(req: AnalyzeRequest) -> dict`

- [ ] **Step 1: Write failing cache and API error tests**

Add tests:

```python
class TestCacheKey(unittest.TestCase):
    def test_changes_for_every_analysis_setting(self):
        base = AnalyzeRequest(url="https://lichess.org/abcdefgh")
        base_key = build_cache_key(base)
        variants = [
            AnalyzeRequest(url=base.url, depth=11),
            AnalyzeRequest(url=base.url, engine="off"),
            AnalyzeRequest(url=base.url, maxTime=3),
            AnalyzeRequest(url=base.url, numLines=2),
            AnalyzeRequest(url=base.url, threads=2),
        ]
        self.assertTrue(all(build_cache_key(item) != base_key for item in variants))


class TestBackendApi(unittest.TestCase):
    def test_provider_timeout_returns_safe_504(self):
        database = MagicMock()
        database.query.return_value.filter.return_value.first.return_value = None
        with patch("main.SessionLocal", return_value=database):
            with patch("main.fetch_lichess_pgn", side_effect=requests.Timeout("secret")):
                response = client.post(
                    "/api/analyze",
                    json={"url": "https://lichess.org/abcdefgh"},
                )
        self.assertEqual(response.status_code, 504)
        self.assertNotIn("secret", response.json()["detail"])

    def test_engine_failure_returns_safe_503(self):
        database = MagicMock()
        database.query.return_value.filter.return_value.first.return_value = None
        with patch("main.SessionLocal", return_value=database):
            with patch("main.fetch_lichess_pgn", return_value="[Result \"*\"]\n\n*"):
                with patch("main.parse_pgn", side_effect=EngineUnavailableError("C:\\secret")):
                    response = client.post(
                        "/api/analyze",
                        json={"url": "https://lichess.org/abcdefgh"},
                    )
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("secret", response.json()["detail"])

    def test_cached_response_skips_provider_fetch(self):
        cached = {"white": "Cached", "moves": []}
        database = MagicMock()
        database.query.return_value.filter.return_value.first.return_value = (
            SimpleNamespace(data=cached)
        )
        with patch("main.SessionLocal", return_value=database):
            with patch(
                "main.fetch_lichess_pgn",
                side_effect=AssertionError("provider should not be called"),
            ):
                response = client.post(
                    "/api/analyze",
                    json={"url": "https://lichess.org/abcdefgh"},
                )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), cached)
```

Import `SimpleNamespace`, `MagicMock`, `requests`, `AnalyzeRequest`, and `build_cache_key`.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
venv\Scripts\python.exe -m unittest test_main.TestCacheKey test_main.TestBackendApi -v
```

Working directory: `backend`

Expected: tests fail because the cache-key and provider helpers do not exist and route errors still expose raw exception strings.

- [ ] **Step 3: Add provider helpers and deterministic cache keys**

Add:

```python
logger = logging.getLogger(__name__)
CACHE_VERSION = 2


def build_cache_key(req: AnalyzeRequest) -> str:
    return ":".join(
        map(
            str,
            (
                CACHE_VERSION,
                req.depth,
                req.engine,
                req.maxTime,
                req.numLines,
                req.threads,
            ),
        )
    )
```

Move existing Lichess and Chess.com request logic into `fetch_lichess_pgn` and `fetch_chess_com_pgn`. Accept a `requests.Session`, retain the existing request headers and ten-second timeout, and raise `HTTPException` with the existing provider-specific `404` details when the provider confirms a missing game.

- [ ] **Step 4: Replace the route with synchronous orchestration and safe errors**

Change the route declaration to:

```python
@app.post("/api/analyze")
def analyze_game(req: AnalyzeRequest):
```

The route must:

1. Parse the provider and ID with `parse_game_url`.
2. Query `GameRecord` with `req.url` and `build_cache_key(req)`.
3. Return cached JSON immediately when present.
4. Open one `requests.Session` and call the matching provider helper.
5. Parse and analyze the PGN.
6. Store the complete result under the versioned cache key.
7. Commit only after complete success.
8. Roll back when database persistence fails.
9. Always close the database session.

Map failures in this order:

```python
except HTTPException:
    raise
except requests.Timeout:
    raise HTTPException(status_code=504, detail="Chess provider timed out")
except requests.RequestException:
    raise HTTPException(status_code=502, detail="Could not reach chess provider")
except EngineUnavailableError:
    raise HTTPException(status_code=503, detail="Chess engine unavailable")
except ValueError:
    raise HTTPException(status_code=422, detail="Could not parse game PGN")
except Exception:
    logger.exception("Unexpected game analysis failure")
    raise HTTPException(status_code=500, detail="Could not process game")
finally:
    db.close()
```

Use `raise ... from None` for client-facing exceptions where necessary to avoid chained internals in server responses.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```powershell
venv\Scripts\python.exe -m unittest test_main.TestCacheKey test_main.TestBackendApi -v
```

Working directory: `backend`

Expected: all focused tests pass without live provider traffic.

- [ ] **Step 6: Run full verification**

Run:

```powershell
backend\venv\Scripts\python.exe -m unittest discover -s backend -p "test_main.py" -v
backend\venv\Scripts\python.exe -m compileall -q backend
```

Expected: all backend tests pass and compileall exits with code zero.

- [ ] **Step 7: Review the final diff against the design**

Run:

```powershell
git diff --check
git diff --stat
git diff -- backend/main.py backend/test_main.py
```

Confirm:

- no frontend file changed
- no dependency changed
- successful response keys remain unchanged
- every client error is stable and sanitized
- engine cleanup remains in `finally`
- the two-ply performance regression test proves exactly three evaluations

- [ ] **Step 8: Commit Task 3**

```powershell
git add backend/main.py backend/test_main.py
git commit -m "refactor: harden backend provider errors and caching"
```
