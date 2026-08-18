import '../../../data/models/game_analysis.dart';
import 'board_position.dart';

enum MoveTransitionType {
  normal,
  capture,
  castle,
  promotion,
  enPassant,
  directJump,
}

class MoveTransition {
  const MoveTransition({
    required this.type,
    required this.source,
    required this.destination,
    this.capturedSquare,
  });

  final MoveTransitionType type;
  final BoardSquare source;
  final BoardSquare destination;
  final BoardSquare? capturedSquare;
}

MoveTransition deriveTransition(
  BoardPosition before,
  BoardPosition after,
  GameMove move,
) {
  final uci = move.playedMove;
  if (uci == null || !RegExp(r'^[a-h][1-8][a-h][1-8][qrbn]?$').hasMatch(uci)) {
    return const MoveTransition(
      type: MoveTransitionType.directJump,
      source: BoardSquare(file: 0, rank: 1),
      destination: BoardSquare(file: 0, rank: 1),
    );
  }

  final source = BoardSquare.fromAlgebraic(uci.substring(0, 2));
  final destination = BoardSquare.fromAlgebraic(uci.substring(2, 4));
  final movingPiece = before.pieceAt(source);
  if (movingPiece == null) {
    return MoveTransition(
      type: MoveTransitionType.directJump,
      source: source,
      destination: destination,
    );
  }

  if (uci.length == 5) {
    return MoveTransition(
      type: MoveTransitionType.promotion,
      source: source,
      destination: destination,
    );
  }

  if (movingPiece.type == PieceType.king &&
      (source.file - destination.file).abs() == 2) {
    return MoveTransition(
      type: MoveTransitionType.castle,
      source: source,
      destination: destination,
    );
  }

  final targetBefore = before.pieceAt(destination);
  if (targetBefore != null) {
    return MoveTransition(
      type: MoveTransitionType.capture,
      source: source,
      destination: destination,
      capturedSquare: destination,
    );
  }

  if (movingPiece.type == PieceType.pawn && source.file != destination.file) {
    final capturedSquare = BoardSquare(
      file: destination.file,
      rank: source.rank,
    );
    final capturedBefore = before.pieceAt(capturedSquare);
    final capturedAfter = after.pieceAt(capturedSquare);
    if (capturedBefore?.type == PieceType.pawn && capturedAfter == null) {
      return MoveTransition(
        type: MoveTransitionType.enPassant,
        source: source,
        destination: destination,
        capturedSquare: capturedSquare,
      );
    }
  }

  return MoveTransition(
    type: MoveTransitionType.normal,
    source: source,
    destination: destination,
  );
}
