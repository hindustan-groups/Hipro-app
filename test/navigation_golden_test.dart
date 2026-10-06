import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hipro_app/main.dart';

void main() {
  testWidgets('floating navigation visual', (tester) async {
    await _loadGoldenFonts();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const Hipro());
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('../design-qa/navigation-home-390x844.png'),
    );
  });
}

Future<void> _loadGoldenFonts() async {
  final roboto = FontLoader('Roboto')
    ..addFont(_fontData('C:/src/flutter/bin/cache/artifacts/material_fonts/roboto-regular.ttf'))
    ..addFont(_fontData('C:/src/flutter/bin/cache/artifacts/material_fonts/roboto-medium.ttf'))
    ..addFont(_fontData('C:/src/flutter/bin/cache/artifacts/material_fonts/roboto-bold.ttf'));
  final materialIcons = FontLoader('MaterialIcons')
    ..addFont(
      _fontData(
        'C:/src/flutter/bin/cache/artifacts/material_fonts/materialicons-regular.otf',
      ),
    );

  await Future.wait([roboto.load(), materialIcons.load()]);
}

Future<ByteData> _fontData(String path) async {
  final bytes = await File(path).readAsBytes();
  return ByteData.view(bytes.buffer);
}
