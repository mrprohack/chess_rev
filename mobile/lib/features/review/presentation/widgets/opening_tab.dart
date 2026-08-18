import 'package:flutter/material.dart';

class OpeningTab extends StatelessWidget {
  const OpeningTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'Opening information unavailable',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
