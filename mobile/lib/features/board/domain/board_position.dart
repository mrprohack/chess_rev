enum PieceColor { white, black }

enum PieceType { pawn, knight, bishop, rook, queen, king }

class BoardPiece {
  const BoardPiece({required this.color, required this.type});

  final PieceColor color;
  final PieceType type;
}

class BoardSquare {
  const BoardSquare({required this.file, required this.rank});

  final int file;
  final int rank;

  factory BoardSquare.fromAlgebraic(String value) {
    if (!RegExp(r'^[a-h][1-8]$').hasMatch(value)) {
      throw FormatException('Invalid square: $value');
    }
    return BoardSquare(
      file: value.codeUnitAt(0) - 'a'.codeUnitAt(0),
      rank: int.parse(value[1]),
    );
  }

  String get algebraic =>
      '${String.fromCharCode('a'.codeUnitAt(0) + file)}$rank';

  @override
  bool operator ==(Object other) {
    return other is BoardSquare && other.file == file && other.rank == rank;
  }

  @override
  int get hashCode => Object.hash(file, rank);
}

class BoardPosition {
  const BoardPosition({
    required this.pieces,
    required this.whiteToMove,
    required this.castling,
    required this.enPassant,
  });

  final Map<BoardSquare, BoardPiece> pieces;
  final bool whiteToMove;
  final String castling;
  final BoardSquare? enPassant;

  BoardPiece? pieceAt(BoardSquare square) => pieces[square];

  factory BoardPosition.fromFen(String fen) {
    final fields = fen.trim().split(RegExp(r'\s+'));
    if (fields.length < 4) throw const FormatException('Malformed FEN');
    final ranks = fields[0].split('/');
    if (ranks.length != 8) throw const FormatException('FEN must have 8 ranks');

    final pieces = <BoardSquare, BoardPiece>{};
    for (var row = 0; row < 8; row++) {
      var file = 0;
      final rank = 8 - row;
      for (final rune in ranks[row].runes) {
        final token = String.fromCharCode(rune);
        final empty = int.tryParse(token);
        if (empty != null) {
          if (empty < 1 || empty > 8) {
            throw const FormatException('Invalid empty-square count');
          }
          file += empty;
          continue;
        }
        final piece = _pieceFromFenToken(token);
        if (piece == null || file >= 8) {
          throw const FormatException('Invalid FEN piece placement');
        }
        pieces[BoardSquare(file: file, rank: rank)] = piece;
        file += 1;
      }
      if (file != 8) throw const FormatException('Each FEN rank must contain 8 squares');
    }

    if (fields[1] != 'w' && fields[1] != 'b') {
      throw const FormatException('Invalid active color');
    }
    final enPassant = fields[3] == '-'
        ? null
        : BoardSquare.fromAlgebraic(fields[3]);
    return BoardPosition(
      pieces: Map.unmodifiable(pieces),
      whiteToMove: fields[1] == 'w',
      castling: fields[2],
      enPassant: enPassant,
    );
  }
}

BoardPiece? _pieceFromFenToken(String token) {
  final lower = token.toLowerCase();
  final type = switch (lower) {
    'p' => PieceType.pawn,
    'n' => PieceType.knight,
    'b' => PieceType.bishop,
    'r' => PieceType.rook,
    'q' => PieceType.queen,
    'k' => PieceType.king,
    _ => null,
  };
  if (type == null) return null;
  return BoardPiece(
    color: token == lower ? PieceColor.black : PieceColor.white,
    type: type,
  );
}
