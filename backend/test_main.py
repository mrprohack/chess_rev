import unittest
from main import app

class TestApp(unittest.TestCase):
    def test_app_exists(self):
        self.assertIsNotNone(app)
        self.assertEqual(app.title, "FastAPI")

if __name__ == '__main__':
    unittest.main()
