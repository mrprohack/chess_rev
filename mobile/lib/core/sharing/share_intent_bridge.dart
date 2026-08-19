import 'package:flutter/services.dart';

class ShareIntentBridge {
  const ShareIntentBridge();

  static const _methodChannel = MethodChannel('com.reviewchess.app/share');
  static const _eventChannel = EventChannel('com.reviewchess.app/shareEvents');

  Future<String?> getInitialSharedText() async {
    try {
      return await _methodChannel.invokeMethod<String>('getInitialSharedText');
    } on MissingPluginException {
      return null;
    }
  }

  Future<bool> shareText(String text) async {
    final normalized = text.trim();
    if (normalized.isEmpty) return false;
    try {
      return await _methodChannel.invokeMethod<bool>(
            'shareText',
            <String, Object?>{'text': normalized},
          ) ??
          false;
    } on MissingPluginException {
      return false;
    } on PlatformException {
      return false;
    }
  }

  Stream<String> get sharedTextStream {
    return _eventChannel
        .receiveBroadcastStream()
        .where((event) => event is String)
        .cast<String>();
  }
}
