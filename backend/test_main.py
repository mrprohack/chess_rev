import unittest
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

