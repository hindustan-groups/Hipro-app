import 'package:flutter_test/flutter_test.dart';
import 'package:hipro_app/main.dart';

void main() {
  testWidgets('Hipro home screen loads', (tester) async {
    await tester.pumpWidget(const Hipro());
    await tester.pump();

    expect(find.text('HIPRO'), findsOneWidget);
    expect(find.text('Repair smarter.\nLive better.'), findsOneWidget);
    expect(find.text('Search services'), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);

    await tester.tap(find.bySemanticsLabel('Services'));
    await tester.pumpAndSettle();

    expect(find.text('Explore services'), findsOneWidget);
    expect(find.text('Services'), findsOneWidget);
  });
}
