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

  Stream<String> get sharedTextStream {
    return _eventChannel
        .receiveBroadcastStream()
        .where((event) => event is String)
        .cast<String>();
  }
}
