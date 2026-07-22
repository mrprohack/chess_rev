import unittest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

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

