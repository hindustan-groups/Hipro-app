import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hipro_app/main.dart';

void main() {
  testWidgets('Hipro full user journey loads and navigates smoothly', (tester) async {
    tester.view.physicalSize = const Size(390 * 2, 844 * 2);
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const Hipro());
    await tester.pumpAndSettle();

    // 1. Onboarding Screen verification
    expect(find.text('Hipro'), findsWidgets);
    expect(find.text('Your Construction &\nService Partner'), findsOneWidget);
    expect(find.text('Next'), findsOneWidget);

    // 2. Navigate to 2nd slide
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();

    expect(find.text('Get Started'), findsOneWidget);

    // 3. Navigate to Login screen
    await tester.tap(find.text('Get Started'));
    await tester.pumpAndSettle();

    expect(find.text('Welcome Back'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);

    // 4. Click Login to enter Main Navigation
    await tester.tap(find.text('Login'));
    await tester.pumpAndSettle();

    // 5. Main Home Screen verification
    expect(find.text('Hello, Piyush 👋'), findsOneWidget);
    expect(find.text('Recent Activity'), findsOneWidget);

    // 6. Navigate to Services tab
    await tester.tap(find.byKey(const ValueKey('nav_tab_services')));
    await tester.pumpAndSettle();

    expect(find.text('Civil Construction'), findsWidgets);
    expect(find.text('Architectural Design'), findsWidgets);

    // 7. Navigate to Quotes tab
    await tester.tap(find.byKey(const ValueKey('nav_tab_quotes')));
    await tester.pumpAndSettle();

    expect(find.text('Quotations'), findsWidgets);

    // 8. Navigate to Profile tab
    await tester.tap(find.byKey(const ValueKey('nav_tab_profile')));
    await tester.pumpAndSettle();

    expect(find.text('Profile'), findsWidgets);
  });
}
