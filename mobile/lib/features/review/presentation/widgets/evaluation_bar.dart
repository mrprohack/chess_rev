import 'package:flutter/material.dart';

class EvaluationBar extends StatelessWidget {
  const EvaluationBar({this.evaluation, super.key});

  final double? evaluation;

  @override
  Widget build(BuildContext context) {
    final value = evaluation ?? 0;
    final whiteShare = (0.5 + value.clamp(-8, 8) / 16).clamp(0.04, 0.96);
    return Semantics(
      label: 'Evaluation ${value.toStringAsFixed(2)}',
      child: ClipRRect(
        borderRadius: BorderRadius.circular(99),
        child: SizedBox(
          width: 8,
          child: Column(
            children: [
              Expanded(
                flex: ((1 - whiteShare) * 1000).round(),
                child: const ColoredBox(color: Color(0xFF232323)),
              ),
              Expanded(
                flex: (whiteShare * 1000).round(),
                child: const ColoredBox(color: Color(0xFFE8E8E8)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
