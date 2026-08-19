import 'package:flutter_test/flutter_test.dart';
import 'package:reviewchess/features/review/presentation/review_notation.dart';

void main() {
  test('figurine notation replaces only the leading piece letter', () {
    expect(displaySan('Nxf7+', figurineNotation: true), '♘xf7+');
    expect(displaySan('Qh5#', figurineNotation: true), '♕h5#');
    expect(displaySan('O-O', figurineNotation: true), 'O-O');
    expect(displaySan('e4', figurineNotation: true), 'e4');
  });

  test('plain notation remains unchanged when disabled', () {
    expect(displaySan('Nxf7+', figurineNotation: false), 'Nxf7+');
  });
}
