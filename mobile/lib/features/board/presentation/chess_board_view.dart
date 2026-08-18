import 'dart:math' as math;
import 'dart:ui' show lerpDouble;

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../data/models/game_analysis.dart';
import '../domain/board_position.dart';
import '../domain/move_transition.dart';
import 'board_theme.dart';

class ChessBoardView extends StatelessWidget {
  const ChessBoardView({
    required this.position,
    this.previousPosition,
    this.move,
    this.flipped = false,
    this.showCoordinates = true,
    this.showArrows = true,
    this.reduceMotion = false,
    this.boardTheme = 'wood',
    super.key,
  });

  final BoardPosition position;
  final BoardPosition? previousPosition;
  final GameMove? move;
  final bool flipped;
  final bool showCoordinates;
  final bool showArrows;
  final bool reduceMotion;
  final String boardTheme;

  @override
  Widget build(BuildContext context) {
    MoveTransition? transition;
    if (!reduceMotion && previousPosition != null && move != null) {
      transition = deriveTransition(previousPosition!, position, move!);
      if (transition.type == MoveTransitionType.directJump) {
        transition = null;
      }
    }

    final palette = boardPaletteFor(boardTheme);
    return AspectRatio(
      aspectRatio: 1,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final boardSize = constraints.maxWidth;
          final squareSize = boardSize / 8;
          return TweenAnimationBuilder<double>(
            key: ValueKey(
              move?.fen ?? '${position.pieces.length}-$flipped-$boardTheme',
            ),
            tween: Tween(begin: 0, end: 1),
            duration: transition == null
                ? Duration.zero
                : const Duration(milliseconds: 220),
            curve: Curves.easeInOutCubic,
            builder: (context, progress, _) {
              return ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Stack(
                  children: [
                    ..._buildSquares(squareSize, palette),
                    if (showArrows) _buildBestMoveArrow(context, squareSize),
                    ..._buildTargetPieces(squareSize, transition, progress),
                    if (transition != null && progress < 1)
                      _buildMovingPiece(squareSize, transition, progress),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  List<Widget> _buildSquares(double squareSize, BoardPalette palette) {
    final widgets = <Widget>[];
    for (var rank = 1; rank <= 8; rank++) {
      for (var file = 0; file < 8; file++) {
        final square = BoardSquare(file: file, rank: rank);
        final row = _rowFor(square);
        final column = _columnFor(square);
        final isLight = (file + rank).isOdd;
        final color = isLight ? palette.lightSquare : palette.darkSquare;
        final labelColor = isLight ? palette.darkSquare : palette.lightSquare;
        widgets.add(
          Positioned(
            key: Key('square-${square.algebraic}'),
            left: column * squareSize,
            top: row * squareSize,
            width: squareSize,
            height: squareSize,
            child: ColoredBox(
              color: color,
              child: showCoordinates
                  ? Align(
                      alignment: Alignment.bottomLeft,
                      child: Padding(
                        padding: const EdgeInsets.all(2),
                        child: Text(
                          square.algebraic,
                          style: TextStyle(
                            fontSize: 8,
                            fontWeight: FontWeight.w700,
                            color: labelColor,
                          ),
                        ),
                      ),
                    )
                  : null,
            ),
          ),
        );
      }
    }
    return widgets;
  }

  Widget _buildBestMoveArrow(BuildContext context, double squareSize) {
    final bestMove = move?.bestMove;
    if (bestMove == null || bestMove.length < 4) {
      return const SizedBox.shrink();
    }

    BoardSquare source;
    BoardSquare destination;
    try {
      source = BoardSquare.fromAlgebraic(bestMove.substring(0, 2));
      destination = BoardSquare.fromAlgebraic(bestMove.substring(2, 4));
    } on FormatException {
      return const SizedBox.shrink();
    }

    final sourceCenter = Offset(
      (_columnFor(source) + 0.5) * squareSize,
      (_rowFor(source) + 0.5) * squareSize,
    );
    final destinationCenter = Offset(
      (_columnFor(destination) + 0.5) * squareSize,
      (_rowFor(destination) + 0.5) * squareSize,
    );
    final arrowColor = Theme.of(context).colorScheme.primary.withValues(
      alpha: 0.78,
    );

    return Positioned.fill(
      key: const Key('best-move-arrow'),
      child: IgnorePointer(
        child: CustomPaint(
          painter: _BestMoveArrowPainter(
            source: sourceCenter,
            destination: destinationCenter,
            color: arrowColor,
            squareSize: squareSize,
          ),
        ),
      ),
    );
  }

  List<Widget> _buildTargetPieces(
    double squareSize,
    MoveTransition? transition,
    double progress,
  ) {
    final widgets = <Widget>[];
    for (final entry in position.pieces.entries) {
      if (transition != null &&
          progress < 1 &&
          entry.key == transition.destination) {
        continue;
      }
      widgets.add(_positionedPiece(entry.key, entry.value, squareSize));
    }
    return widgets;
  }

  Widget _buildMovingPiece(
    double squareSize,
    MoveTransition transition,
    double progress,
  ) {
    final piece = previousPosition!.pieceAt(transition.source);
    if (piece == null) {
      return const SizedBox.shrink();
    }
    final sourceRow = _rowFor(transition.source).toDouble();
    final sourceColumn = _columnFor(transition.source).toDouble();
    final targetRow = _rowFor(transition.destination).toDouble();
    final targetColumn = _columnFor(transition.destination).toDouble();
    final row = lerpDouble(sourceRow, targetRow, progress)!;
    final column = lerpDouble(sourceColumn, targetColumn, progress)!;
    return Positioned(
      left: column * squareSize,
      top: row * squareSize,
      width: squareSize,
      height: squareSize,
      child: Padding(
        padding: EdgeInsets.all(squareSize * 0.07),
        child: SvgPicture.asset(_assetFor(piece)),
      ),
    );
  }

  Widget _positionedPiece(
    BoardSquare square,
    BoardPiece piece,
    double squareSize,
  ) {
    return Positioned(
      key: Key('piece-${square.algebraic}'),
      left: _columnFor(square) * squareSize,
      top: _rowFor(square) * squareSize,
      width: squareSize,
      height: squareSize,
      child: Padding(
        padding: EdgeInsets.all(squareSize * 0.07),
        child: SvgPicture.asset(_assetFor(piece)),
      ),
    );
  }

  int _columnFor(BoardSquare square) =>
      flipped ? 7 - square.file : square.file;

  int _rowFor(BoardSquare square) =>
      flipped ? square.rank - 1 : 8 - square.rank;

  String _assetFor(BoardPiece piece) {
    final color = piece.color == PieceColor.white ? 'w' : 'b';
    final type = switch (piece.type) {
      PieceType.pawn => 'P',
      PieceType.knight => 'N',
      PieceType.bishop => 'B',
      PieceType.rook => 'R',
      PieceType.queen => 'Q',
      PieceType.king => 'K',
    };
    return 'assets/pieces/$color$type.svg';
  }
}

class _BestMoveArrowPainter extends CustomPainter {
  const _BestMoveArrowPainter({
    required this.source,
    required this.destination,
    required this.color,
    required this.squareSize,
  });

  final Offset source;
  final Offset destination;
  final Color color;
  final double squareSize;

  @override
  void paint(Canvas canvas, Size size) {
    final delta = destination - source;
    if (delta.distance == 0) {
      return;
    }

    final strokeWidth = math.max(4.0, squareSize * 0.12);
    final headLength = math.max(10.0, squareSize * 0.28);
    final angle = math.atan2(delta.dy, delta.dx);
    final direction = Offset(math.cos(angle), math.sin(angle));
    final shortenedEnd = destination - direction * (squareSize * 0.16);

    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    canvas.drawLine(source, shortenedEnd, paint);

    final headPaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    final leftDirection = Offset(
      math.cos(angle - math.pi / 6),
      math.sin(angle - math.pi / 6),
    );
    final rightDirection = Offset(
      math.cos(angle + math.pi / 6),
      math.sin(angle + math.pi / 6),
    );
    final left = shortenedEnd - leftDirection * headLength;
    final right = shortenedEnd - rightDirection * headLength;
    final path = Path()
      ..moveTo(shortenedEnd.dx, shortenedEnd.dy)
      ..lineTo(left.dx, left.dy)
      ..lineTo(right.dx, right.dy)
      ..close();
    canvas.drawPath(path, headPaint);
  }

  @override
  bool shouldRepaint(covariant _BestMoveArrowPainter oldDelegate) {
    return oldDelegate.source != source ||
        oldDelegate.destination != destination ||
        oldDelegate.color != color ||
        oldDelegate.squareSize != squareSize;
  }
}
