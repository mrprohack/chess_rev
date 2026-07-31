import unittest
from unittest.mock import patch

import chess
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
        self.assertEqual(engine.analysis_count, 3)
        self.assertTrue(engine.closed)

    def test_closes_engine_when_analysis_fails(self):
        engine = FakeEngine(fail_after=1)
        with patch("main.chess.engine.SimpleEngine.popen_uci", return_value=engine):
            with self.assertRaises(Exception) as caught:
                main.parse_pgn(self.short_pgn)
        self.assertEqual(type(caught.exception).__name__, "EngineUnavailableError")
        self.assertTrue(engine.closed)


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
        r = client.post("/api/analyze", json={"url": "https://lichess.org/nonexistent99999"})
        self.assertEqual(r.status_code, 404)
        self.assertEqual(r.json().get("detail"), "Game not found on Lichess")

if __name__ == "__main__":
    unittest.main()

