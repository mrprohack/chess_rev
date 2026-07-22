import unittest
import requests

BASE_URL = "http://127.0.0.1:8001"

class TestBackendApi(unittest.TestCase):
    def test_root_endpoint(self):
        r = requests.get(f"{BASE_URL}/", timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertIn("Chess API is running", r.json().get("message", ""))

    def test_invalid_provider_url(self):
        r = requests.post(f"{BASE_URL}/api/analyze", json={"url": "https://invalid.com/game"}, timeout=5)
        self.assertEqual(r.status_code, 400)
        self.assertIn("Must be chess.com or lichess.org", r.json().get("detail", ""))

    def test_nonexistent_lichess_game(self):
        r = requests.post(f"{BASE_URL}/api/analyze", json={"url": "https://lichess.org/nonexistent99999"}, timeout=10)
        self.assertEqual(r.status_code, 404)
        self.assertEqual(r.json().get("detail"), "Game not found on Lichess")

if __name__ == "__main__":
    unittest.main()
