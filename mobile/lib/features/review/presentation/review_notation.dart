String displaySan(String san, {required bool figurineNotation}) {
  if (!figurineNotation || san.isEmpty) {
    return san;
  }

  const figurines = <String, String>{
    'K': '♔',
    'Q': '♕',
    'R': '♖',
    'B': '♗',
    'N': '♘',
  };

  final replacement = figurines[san[0]];
  if (replacement == null) {
    return san;
  }
  return '$replacement${san.substring(1)}';
}
