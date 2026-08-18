import 'dart:async';

import 'package:just_audio/just_audio.dart';

import '../../../data/models/app_settings.dart';
import '../../../data/models/game_analysis.dart';

enum MoveSoundKind { move, capture, check, castle, promotion, gameEnd }

MoveSoundKind soundKindForMove(GameMove move) {
  final san = move.notation;
  if (san.contains('#')) return MoveSoundKind.gameEnd;
  if (san == 'O-O' || san == 'O-O-O') return MoveSoundKind.castle;
  if (san.contains('=')) return MoveSoundKind.promotion;
  if (san.contains('+')) return MoveSoundKind.check;
  if (san.contains('x')) return MoveSoundKind.capture;
  return MoveSoundKind.move;
}

class MoveSoundService {
  MoveSoundService([AudioPlayer? player]) : _player = player ?? AudioPlayer();

  final AudioPlayer _player;

  void play(GameMove? move, AppSettings settings) {
    if (move == null || !settings.soundEnabled || settings.soundVolume <= 0) {
      return;
    }
    unawaited(_play(move, settings.soundVolume));
  }

  Future<void> _play(GameMove move, double volume) async {
    final kind = soundKindForMove(move);
    final name = switch (kind) {
      MoveSoundKind.move => 'move',
      MoveSoundKind.capture => 'capture',
      MoveSoundKind.check => 'check',
      MoveSoundKind.castle => 'castle',
      MoveSoundKind.promotion => 'promotion',
      MoveSoundKind.gameEnd => 'game_end',
    };
    try {
      await _player.setVolume(volume.clamp(0, 1));
      await _player.setAsset('assets/sounds/$name.wav');
      await _player.seek(Duration.zero);
      await _player.play();
    } catch (_) {
      // Audio failure must never interrupt review navigation.
    }
  }

  Future<void> dispose() => _player.dispose();
}
