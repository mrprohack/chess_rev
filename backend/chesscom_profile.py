from urllib.parse import quote

import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

CHESS_COM_HEADERS = {
    "User-Agent": "ChessGameReview/1.0 (https://github.com/mrprohack/chess_rev)",
    "Accept": "application/json",
}


def _request_json(session: requests.Session, url: str, *, not_found_detail: str | None = None):
    response = session.get(url, headers=CHESS_COM_HEADERS, timeout=10)
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail=not_found_detail or "Chess.com data not found")
    if response.status_code == 429:
        raise HTTPException(status_code=429, detail="Chess.com rate limit reached. Try again shortly.")
    response.raise_for_status()
    return response.json()


def _rating(stats: dict, key: str):
    value = stats.get(key, {}).get("last", {}).get("rating")
    return value if isinstance(value, (int, float)) else None


def _normalize_game(game: dict):
    return {
        "uuid": game.get("uuid"),
        "url": game.get("url"),
        "end_time": game.get("end_time"),
        "time_class": game.get("time_class"),
        "rated": bool(game.get("rated")),
        "white": {
            "username": game.get("white", {}).get("username"),
            "rating": game.get("white", {}).get("rating"),
            "result": game.get("white", {}).get("result"),
        },
        "black": {
            "username": game.get("black", {}).get("username"),
            "rating": game.get("black", {}).get("rating"),
            "result": game.get("black", {}).get("result"),
        },
    }


@router.get("/api/chesscom/profile/{username}")
def get_chess_com_profile(username: str, limit: int = Query(default=12, ge=1, le=20)):
    cleaned = username.strip()
    if not cleaned or len(cleaned) > 50:
        raise HTTPException(status_code=400, detail="Invalid Chess.com username")

    encoded = quote(cleaned, safe="")
    base = f"https://api.chess.com/pub/player/{encoded}"

    try:
        with requests.Session() as session:
            profile = _request_json(
                session,
                base,
                not_found_detail="Chess.com profile not found",
            )
            stats = _request_json(
                session,
                f"{base}/stats",
                not_found_detail="Chess.com profile stats not found",
            )
            archives = _request_json(
                session,
                f"{base}/games/archives",
                not_found_detail="Chess.com game archive not found",
            )

            games = []
            archive_urls = archives.get("archives", [])
            for archive_url in reversed(archive_urls[-3:]):
                archive = _request_json(session, archive_url)
                month_games = [
                    _normalize_game(game)
                    for game in archive.get("games", [])
                    if game.get("rules", "chess") == "chess" and game.get("url")
                ]
                month_games.sort(key=lambda item: item.get("end_time") or 0, reverse=True)
                games.extend(month_games)
                if len(games) >= limit:
                    break

            games = games[:limit]

        return {
            "username": profile.get("username") or cleaned,
            "name": profile.get("name"),
            "avatar": profile.get("avatar"),
            "url": profile.get("url") or f"https://www.chess.com/member/{encoded}",
            "status": profile.get("status"),
            "ratings": {
                "rapid": _rating(stats, "chess_rapid"),
                "blitz": _rating(stats, "chess_blitz"),
                "bullet": _rating(stats, "chess_bullet"),
            },
            "games": games,
        }
    except HTTPException:
        raise
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Chess.com timed out") from None
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Could not reach Chess.com") from None
