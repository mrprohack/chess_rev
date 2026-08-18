import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/core/storage/local_cache.dart';
import 'package:reviewchess/data/models/chesscom_profile.dart';

void main() {
  test('stores only lightweight profile bookmarks and recent URLs', () async {
    final cache = MemoryLocalCache();
    const profile = ChessComProfile(
      username: 'Alpha',
      ratings: ChessComRatings(rapid: 1500),
      games: [],
    );

    await cache.writeProfile(profile);
    await cache.writeBookmarks('https://lichess.org/abcdefgh', [4, 9]);
    await cache.addRecentUrl('https://lichess.org/abcdefgh');

    expect((await cache.readProfile())?.username, 'Alpha');
    expect(await cache.readBookmarks('https://lichess.org/abcdefgh'), [4, 9]);
    expect(await cache.readRecentUrls(), ['https://lichess.org/abcdefgh']);
  });

  test('recent URLs are deduplicated and newest first', () async {
    final cache = MemoryLocalCache();
    await cache.addRecentUrl('https://lichess.org/abcdefgh');
    await cache.addRecentUrl('https://www.chess.com/game/170804338698');
    await cache.addRecentUrl('https://lichess.org/abcdefgh');
    expect(await cache.readRecentUrls(), [
      'https://lichess.org/abcdefgh',
      'https://www.chess.com/game/170804338698',
    ]);
  });
}
