import 'dart:async';
import 'dart:typed_data';

import 'package:dio/dio.dart';

class StubHttpAdapter implements HttpClientAdapter {
  StubHttpAdapter(this.handler);

  final FutureOr<ResponseBody> Function(RequestOptions options) handler;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return handler(options);
  }

  @override
  void close({bool force = false}) {}
}
