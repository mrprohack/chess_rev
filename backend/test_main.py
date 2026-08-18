import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import chess
import requests
from fastapi import HTTPException
from fastapi.testclient import TestClient
import main

client = TestClient(main.app)


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
    def parse(self, url):
        parser = getattr(main, "parse_game_url", None)
        self.assertIsNotNone(parser)
        return parser(url)

    def test_parses_lichess_game_id(self):
        self.assertEqual(
            self.parse("https://lichess.org/abcdefgh?foo=bar"),
            ("lichess", "abcdefgh"),
        )

    def test_parses_chess_com_live_game_id(self):
        self.assertEqual(
            self.parse("https://www.chess.com/game/live/170804338698"),
            ("chess.com", "170804338698"),
        )

    def test_parses_lichess_id_with_color_suffix(self):
        self.assertEqual(
            self.parse("https://lichess.org/abcdefgh/white"),
            ("lichess", "abcdefgh"),
        )

    def test_parses_lichess_analysis_url(self):
        self.assertEqual(
            self.parse("https://lichess.org/analysis/abcdefgh"),
            ("lichess", "abcdefgh"),
        )

    def test_parses_lichess_url_with_leading_trailing_whitespace(self):
        self.assertEqual(
            self.parse("  https://lichess.org/abcdefgh/black\n"),
            ("lichess", "abcdefgh"),
        )

    def test_parses_uppercase_provider_host(self):
        self.assertEqual(
            self.parse("https://Lichess.org/abcdefgh"),
            ("lichess", "abcdefgh"),
        )

    def test_parses_chess_com_daily_game_id(self):
        self.assertEqual(
            self.parse("https://www.chess.com/game/daily/170804338698"),
            ("chess.com", "170804338698"),
        )

    def test_parses_chess_com_digit_id_without_live_daily(self):
        self.assertEqual(
            self.parse("https://www.chess.com/game/170804338698"),
            ("chess.com", "170804338698"),
        )

    def test_rejects_lichess_url_without_game_id(self):
        with self.assertRaises(HTTPException) as caught:
            self.parse("https://lichess.org/")
        self.assertEqual(caught.exception.status_code, 400)

    def test_rejects_deceptive_provider_hostname(self):
        with self.assertRaises(HTTPException) as caught:
            self.parse("https://chess.com.attacker.example/game/live/123")
        self.assertEqual(caught.exception.status_code, 400)

    def test_rejects_chess_com_path_without_game_id(self):
        with self.assertRaises(HTTPException) as caught:
            self.parse("https://www.chess.com/game/live/")
        self.assertEqual(caught.exception.status_code, 400)


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
            result = main.parse_pgn(self.short_pgn)
        self.assertEqual(len(result["moves"]), 2)
        self.assertEqual(
            set(result),
            {
                "white",
                "white_rating",
                "black",
                "black_rating",
                "result",
                "base_time",
                "moves",
                "counts",
                "accuracy",
            },
        )
        self.assertEqual(
            set(result["moves"][0]),
            {
                "number",
                "color",
                "notation",
                "classification",
                "fen",
                "time",
                "eval",
                "clock",
                "played_move",
                "best_move",
            },
        )
        self.assertEqual(engine.analysis_count, 3)
        self.assertTrue(engine.closed)

    def test_closes_engine_when_analysis_fails(self):
        engine = FakeEngine(fail_after=1)
        with patch("main.chess.engine.SimpleEngine.popen_uci", return_value=engine):
            with self.assertRaises(Exception) as caught:
                main.parse_pgn(self.short_pgn)
        self.assertEqual(type(caught.exception).__name__, "EngineUnavailableError")
        self.assertTrue(engine.closed)


class TestCacheKey(unittest.TestCase):
    def test_changes_for_every_analysis_setting(self):
        build_cache_key = getattr(main, "build_cache_key", None)
        self.assertIsNotNone(build_cache_key)
        base = main.AnalyzeRequest(url="https://lichess.org/abcdefgh")
        base_key = build_cache_key(base)
        variants = [
            main.AnalyzeRequest(url=base.url, depth=11),
            main.AnalyzeRequest(url=base.url, engine="off"),
            main.AnalyzeRequest(url=base.url, maxTime=3),
            main.AnalyzeRequest(url=base.url, numLines=2),
            main.AnalyzeRequest(url=base.url, threads=2),
        ]
        self.assertTrue(all(build_cache_key(item) != base_key for item in variants))


class TestProviderFetching(unittest.TestCase):
    def test_lichess_not_found_has_provider_specific_error(self):
        fetch = getattr(main, "fetch_lichess_pgn", None)
        self.assertIsNotNone(fetch)
        session = MagicMock()
        session.get.return_value.status_code = 404

        with self.assertRaises(HTTPException) as caught:
            fetch(session, "missing1")

        self.assertEqual(caught.exception.status_code, 404)
        self.assertEqual(caught.exception.detail, "Game not found on Lichess")

    def test_chess_com_finds_pgn_in_monthly_archive(self):
        fetch = getattr(main, "fetch_chess_com_pgn", None)
        self.assertIsNotNone(fetch)
        callback = MagicMock()
        callback.status_code = 200
        callback.json.return_value = {
            "game": {"uuid": "game-uuid", "endTime": 1735689600},
            "players": {"top": {"username": "Alice"}},
        }
        archive = MagicMock()
        archive.status_code = 200
        archive.json.return_value = {
            "games": [{"uuid": "game-uuid", "pgn": "[Result \"*\"]\n\n*"}]
        }
        session = MagicMock()
        session.get.side_effect = [callback, archive]

        self.assertEqual(
            fetch(session, "123"),
            "[Result \"*\"]\n\n*",
        )


class TestBackendApi(unittest.TestCase):
    def test_root_endpoint(self):
        r = client.get("/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("Chess API is running", r.json().get("message", ""))

    def test_invalid_provider_url(self):
        r = client.post("/api/analyze", json={"url": "https://invalid.com/game"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("Must be chess.com or lichess.org", r.json().get("detail", ""))

    def test_nonexistent_lichess_game(self):
        database = MagicMock()
        database.query.return_value.filter.return_value.first.return_value = None
        not_found = HTTPException(status_code=404, detail="Game not found on Lichess")
        provider_response = MagicMock(status_code=404)
        with patch("main.SessionLocal", return_value=database):
            with patch("main.requests.get", return_value=provider_response):
                with patch(
                    "main.fetch_lichess_pgn",
                    create=True,
                    side_effect=not_found,
                ):
                    response = client.post(
                        "/api/analyze",
                        json={"url": "https://lichess.org/nonexistent99999"},
                    )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json().get("detail"), "Game not found on Lichess")

    def test_provider_timeout_returns_safe_504(self):
        database = MagicMock()
        database.query.return_value.filter.return_value.first.return_value = None
        timeout = requests.Timeout("secret provider detail")
        with patch("main.SessionLocal", return_value=database):
            with patch("main.requests.get", side_effect=timeout):
                with patch("main.requests.Session") as session_factory:
                    session_factory.return_value.__enter__.return_value.get.side_effect = timeout
                    response = client.post(
                        "/api/analyze",
                        json={"url": "https://lichess.org/timeoutcase1"},
                    )
        self.assertEqual(response.status_code, 504)
        self.assertNotIn("secret", response.json()["detail"])

    def test_engine_failure_returns_safe_503(self):
        database = MagicMock()
        database.query.return_value.filter.return_value.first.return_value = None
        provider_response = MagicMock()
        provider_response.status_code = 200
        provider_response.text = "[Result \"*\"]\n\n*"
        with patch("main.SessionLocal", return_value=database):
            with patch("main.requests.get", return_value=provider_response):
                with patch("main.requests.Session") as session_factory:
                    session_factory.return_value.__enter__.return_value.get.return_value = provider_response
                    with patch(
                        "main.parse_pgn",
                        side_effect=main.EngineUnavailableError("C:\\secret\\stockfish.exe"),
                    ):
                        response = client.post(
                            "/api/analyze",
                            json={"url": "https://lichess.org/enginefail1"},
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
                "main.requests.get",
                side_effect=AssertionError("provider should not be called"),
            ):
                response = client.post(
                    "/api/analyze",
                    json={"url": "https://lichess.org/cachedcase1"},
                )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), cached)

    def test_database_startup_failure_returns_safe_500(self):
        safe_client = TestClient(main.app, raise_server_exceptions=False)
        with patch(
            "main.SessionLocal",
            side_effect=RuntimeError("secret database detail"),
        ):
            with self.assertLogs(main.logger, level="ERROR"):
                response = safe_client.post(
                    "/api/analyze",
                    json={"url": "https://lichess.org/databasefail1"},
                )
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.headers["content-type"], "application/json")
        self.assertEqual(response.json()["detail"], "Could not process game")

if __name__ == "__main__":
    unittest.main()

