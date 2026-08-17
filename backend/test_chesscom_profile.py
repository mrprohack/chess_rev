import unittest
from unittest.mock import MagicMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

try:
    from chesscom_profile import router
except ImportError:
    router = None


class TestChessComProfileApi(unittest.TestCase):
    def setUp(self):
        self.assertIsNotNone(router, 'chesscom_profile.router must exist')
        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)

    def test_returns_profile_ratings_and_recent_games(self):
        profile_response = MagicMock(status_code=200)
        profile_response.json.return_value = {
            'username': 'Alice',
            'name': 'Alice Example',
            'avatar': 'https://images.chesscomfiles.com/avatar.png',
            'url': 'https://www.chess.com/member/Alice',
        }
        stats_response = MagicMock(status_code=200)
        stats_response.json.return_value = {
            'chess_rapid': {'last': {'rating': 1512}},
            'chess_blitz': {'last': {'rating': 1420}},
            'chess_bullet': {'last': {'rating': 1337}},
        }
        archives_response = MagicMock(status_code=200)
        archives_response.json.return_value = {
            'archives': ['https://api.chess.com/pub/player/Alice/games/2026/08']
        }
        games_response = MagicMock(status_code=200)
        games_response.json.return_value = {
            'games': [
                {
                    'uuid': 'game-1',
                    'url': 'https://www.chess.com/game/live/123',
                    'end_time': 1786940000,
                    'time_class': 'rapid',
                    'rated': True,
                    'rules': 'chess',
                    'white': {'username': 'Alice', 'rating': 1512, 'result': 'win'},
                    'black': {'username': 'Bob', 'rating': 1480, 'result': 'resigned'},
                }
            ]
        }
        session = MagicMock()
        session.get.side_effect = [profile_response, stats_response, archives_response, games_response]

        with patch('chesscom_profile.requests.Session') as session_factory:
            session_factory.return_value.__enter__.return_value = session
            response = self.client.get('/api/chesscom/profile/Alice?limit=5')

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body['username'], 'Alice')
        self.assertEqual(body['ratings']['rapid'], 1512)
        self.assertEqual(body['games'][0]['url'], 'https://www.chess.com/game/live/123')

    def test_uses_previous_archive_when_latest_has_no_standard_games(self):
        response_profile = MagicMock(status_code=200)
        response_profile.json.return_value = {'username': 'Alice'}
        response_stats = MagicMock(status_code=200)
        response_stats.json.return_value = {}
        response_archives = MagicMock(status_code=200)
        response_archives.json.return_value = {
            'archives': [
                'https://api.chess.com/pub/player/Alice/games/2026/07',
                'https://api.chess.com/pub/player/Alice/games/2026/08',
            ]
        }
        august = MagicMock(status_code=200)
        august.json.return_value = {'games': [{'rules': 'chess960', 'url': 'ignore-me'}]}
        july = MagicMock(status_code=200)
        july.json.return_value = {
            'games': [{
                'uuid': 'standard-1', 'rules': 'chess', 'url': 'https://www.chess.com/game/live/456',
                'end_time': 1785000000, 'time_class': 'blitz', 'rated': True,
                'white': {'username': 'Bob', 'rating': 1400, 'result': 'timeout'},
                'black': {'username': 'Alice', 'rating': 1420, 'result': 'win'},
            }]
        }
        session = MagicMock()
        session.get.side_effect = [response_profile, response_stats, response_archives, august, july]

        with patch('chesscom_profile.requests.Session') as session_factory:
            session_factory.return_value.__enter__.return_value = session
            response = self.client.get('/api/chesscom/profile/Alice')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['games'][0]['uuid'], 'standard-1')

    def test_sorts_recent_games_newest_first(self):
        response_profile = MagicMock(status_code=200)
        response_profile.json.return_value = {'username': 'Alice'}
        response_stats = MagicMock(status_code=200)
        response_stats.json.return_value = {}
        response_archives = MagicMock(status_code=200)
        response_archives.json.return_value = {
            'archives': ['https://api.chess.com/pub/player/Alice/games/2026/08']
        }
        games_response = MagicMock(status_code=200)
        games_response.json.return_value = {
            'games': [
                {
                    'uuid': 'newer', 'rules': 'chess', 'url': 'https://www.chess.com/game/live/2',
                    'end_time': 200, 'time_class': 'rapid', 'rated': True,
                    'white': {'username': 'Alice', 'rating': 1500, 'result': 'win'},
                    'black': {'username': 'Bob', 'rating': 1490, 'result': 'resigned'},
                },
                {
                    'uuid': 'older', 'rules': 'chess', 'url': 'https://www.chess.com/game/live/1',
                    'end_time': 100, 'time_class': 'rapid', 'rated': True,
                    'white': {'username': 'Alice', 'rating': 1490, 'result': 'win'},
                    'black': {'username': 'Bob', 'rating': 1480, 'result': 'resigned'},
                },
            ]
        }
        session = MagicMock()
        session.get.side_effect = [response_profile, response_stats, response_archives, games_response]

        with patch('chesscom_profile.requests.Session') as session_factory:
            session_factory.return_value.__enter__.return_value = session
            response = self.client.get('/api/chesscom/profile/Alice')

        self.assertEqual(response.status_code, 200)
        self.assertEqual([game['uuid'] for game in response.json()['games']], ['newer', 'older'])

    def test_maps_missing_profile_to_safe_404(self):
        missing = MagicMock(status_code=404)
        session = MagicMock()
        session.get.return_value = missing
        with patch('chesscom_profile.requests.Session') as session_factory:
            session_factory.return_value.__enter__.return_value = session
            response = self.client.get('/api/chesscom/profile/not-a-real-user')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()['detail'], 'Chess.com profile not found')

    def test_maps_rate_limit_to_safe_429(self):
        limited = MagicMock(status_code=429)
        session = MagicMock()
        session.get.return_value = limited
        with patch('chesscom_profile.requests.Session') as session_factory:
            session_factory.return_value.__enter__.return_value = session
            response = self.client.get('/api/chesscom/profile/Alice')
        self.assertEqual(response.status_code, 429)
        self.assertIn('rate limit', response.json()['detail'].lower())


if __name__ == '__main__':
    unittest.main()
