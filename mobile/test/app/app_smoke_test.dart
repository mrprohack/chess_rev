import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/app/app.dart';

void main() {
  testWidgets('starts on Review with three primary destinations', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: ReviewChessApp()));
    await tester.pumpAndSettle();
    expect(find.text('Review'), findsWidgets);
    expect(find.text('History'), findsOneWidget);
    expect(find.text('Settings'), findsOneWidget);
    expect(find.byType(NavigationBar), findsOneWidget);
  });
}
