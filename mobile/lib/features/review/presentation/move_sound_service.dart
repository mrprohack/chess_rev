import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
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

String soundAssetPath(GameMove move, String soundTheme) {
  const supportedThemes = {'classic', 'soft', 'minimal'};
  final theme = supportedThemes.contains(soundTheme) ? soundTheme : 'classic';
  final name = switch (soundKindForMove(move)) {
    MoveSoundKind.move => 'move',
    MoveSoundKind.capture => 'capture',
    MoveSoundKind.check => 'check',
    MoveSoundKind.castle => 'castle',
    MoveSoundKind.promotion => 'promotion',
    MoveSoundKind.gameEnd => 'game_end',
  };
  return 'assets/sounds/$theme/$name.wav';
}

abstract interface class MoveSoundPlayer {
  void play(GameMove? move, AppSettings settings);
}

class MoveSoundService implements MoveSoundPlayer {
  MoveSoundService([AudioPlayer? player]) : _player = player ?? AudioPlayer();

  final AudioPlayer _player;

  @override
  void play(GameMove? move, AppSettings settings) {
    if (move == null || !settings.soundEnabled || settings.soundVolume <= 0) {
      return;
    }
    unawaited(_play(move, settings));
  }

  Future<void> _play(GameMove move, AppSettings settings) async {
    try {
      await _player.setVolume(settings.soundVolume.clamp(0, 1));
      await _player.setAsset(soundAssetPath(move, settings.soundTheme));
      await _player.seek(Duration.zero);
      await _player.play();
    } catch (_) {
      // Audio failure must never interrupt review navigation.
    }
  }

  Future<void> dispose() => _player.dispose();
}

final moveSoundPlayerProvider = Provider<MoveSoundPlayer>((ref) {
  final service = MoveSoundService();
  ref.onDispose(() => unawaited(service.dispose()));
  return service;
});
