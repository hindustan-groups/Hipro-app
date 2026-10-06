


import 'package:flutter/material.dart';

class HeroCitySkyline extends StatelessWidget {
  const HeroCitySkyline({
    super.key,
    this.height = 320,
  });

  final double height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: CustomPaint(
        painter: _HeroCitySkylinePainter(),
      ),
    );
  }
}

class _HeroCitySkylinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // 1. Layer 1: Low-poly / Geometric Mountain Backing (Light Blue & Cyan Gradients)
    final poly1 = Path()
      ..moveTo(0, h * 0.40)
      ..lineTo(w * 0.35, h * 0.10)
      ..lineTo(w * 0.65, h * 0.35)
      ..lineTo(0, h * 0.65)
      ..close();
    canvas.drawPath(
      poly1,
      Paint()
        ..shader = const LinearGradient(
          colors: [Color(0xFF93C5FD), Color(0xFFBFDBFE), Color(0xFFE0F2FE)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ).createShader(Rect.fromLTWH(0, 0, w, h)),
    );

    final poly2 = Path()
      ..moveTo(w * 0.35, h * 0.10)
      ..lineTo(w, h * 0.02)
      ..lineTo(w, h * 0.55)
      ..lineTo(w * 0.45, h * 0.40)
      ..close();
    canvas.drawPath(
      poly2,
      Paint()
        ..shader = LinearGradient(
          colors: [
            const Color(0xFF60A5FA).withValues(alpha: 0.7),
            const Color(0xFF93C5FD).withValues(alpha: 0.5),
            const Color(0xFFDBEAFE).withValues(alpha: 0.3),
          ],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ).createShader(Rect.fromLTWH(0, 0, w, h)),
    );

    final poly3 = Path()
      ..moveTo(0, h * 0.55)
      ..lineTo(w * 0.45, h * 0.30)
      ..lineTo(w * 0.85, h * 0.48)
      ..lineTo(w, h * 0.42)
      ..lineTo(w, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(
      poly3,
      Paint()
        ..shader = const LinearGradient(
          colors: [Color(0xFFBFDBFE), Color(0xFFE2E8F0), Color(0xFFF8FAFC)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ).createShader(Rect.fromLTWH(0, 0, w, h)),
    );

    // 2. Layer 2: Distant Buildings & High-rises
    final distantBuildings = [
      Rect.fromLTRB(w * 0.02, h * 0.50, w * 0.08, h),
      Rect.fromLTRB(w * 0.12, h * 0.44, w * 0.18, h),
      Rect.fromLTRB(w * 0.28, h * 0.40, w * 0.34, h),
      Rect.fromLTRB(w * 0.42, h * 0.46, w * 0.48, h),
      Rect.fromLTRB(w * 0.62, h * 0.42, w * 0.68, h),
      Rect.fromLTRB(w * 0.82, h * 0.45, w * 0.88, h),
    ];

    final distantPaint = Paint()..color = const Color(0xFF94A3B8).withValues(alpha: 0.35);
    for (final b in distantBuildings) {
      canvas.drawRRect(RRect.fromRectAndRadius(b, const Radius.circular(3)), distantPaint);
    }

    // 3. Layer 3: Main Front Skyscrapers (Realistic Detailed Buildings)
    _drawSkyscraper(canvas, Rect.fromLTRB(w * 0.05, h * 0.38, w * 0.15, h), hasPointedSpire: true);
    _drawSkyscraper(canvas, Rect.fromLTRB(w * 0.16, h * 0.28, w * 0.27, h), hasCrown: true);
    _drawSkyscraper(canvas, Rect.fromLTRB(w * 0.28, h * 0.22, w * 0.40, h), hasPointedSpire: true, isHero: true);
    _drawSkyscraper(canvas, Rect.fromLTRB(w * 0.41, h * 0.32, w * 0.50, h), hasAntenna: true);
    _drawSkyscraper(canvas, Rect.fromLTRB(w * 0.51, h * 0.26, w * 0.60, h), hasPointedSpire: true);
    _drawSkyscraper(canvas, Rect.fromLTRB(w * 0.74, h * 0.30, w * 0.85, h), isGlassTower: true);
    _drawSkyscraper(canvas, Rect.fromLTRB(w * 0.86, h * 0.24, w * 0.96, h), hasPointedSpire: true, isHero: true);

    // 4. Layer 4: Prominent Blue Construction Tower Crane (Standing tall at w * 0.68)
    final craneX = w * 0.68;
    final craneBaseY = h * 0.88;
    final craneTopY = h * 0.08;

    final cranePaint = Paint()
      ..color = const Color(0xFF1D4ED8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.4;

    final craneLatticePaint = Paint()
      ..color = const Color(0xFF2563EB)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    const double mastW = 12.0;

    // Crane Vertical Mast Columns
    canvas.drawLine(Offset(craneX - mastW / 2, craneBaseY), Offset(craneX - mastW / 2, craneTopY), cranePaint);
    canvas.drawLine(Offset(craneX + mastW / 2, craneBaseY), Offset(craneX + mastW / 2, craneTopY), cranePaint);

    // Crane Lattice X-Diagonals
    for (double y = craneTopY; y < craneBaseY; y += 14) {
      canvas.drawLine(Offset(craneX - mastW / 2, y), Offset(craneX + mastW / 2, y + 14), craneLatticePaint);
      canvas.drawLine(Offset(craneX + mastW / 2, y), Offset(craneX - mastW / 2, y + 14), craneLatticePaint);
    }

    // Crane Top Apex / Tower Peak
    final apexPoint = Offset(craneX, craneTopY - 22);
    canvas.drawLine(Offset(craneX - mastW / 2, craneTopY), apexPoint, cranePaint);
    canvas.drawLine(Offset(craneX + mastW / 2, craneTopY), apexPoint, cranePaint);

    // Crane Horizontal Jib (Boom)
    final jibY = craneTopY + 10;
    final jibLeft = craneX - 45; // Counter jib
    final jibRight = craneX + 90; // Main working jib
    canvas.drawLine(Offset(jibLeft, jibY), Offset(jibRight, jibY), cranePaint..strokeWidth = 2.8);

    // Counterweight Box
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(jibLeft, jibY - 4, 16, 12), const Radius.circular(2)),
      Paint()..color = const Color(0xFF1E3A8A),
    );

    // Crane Tension Cables / Tie Wires
    canvas.drawLine(apexPoint, Offset(jibLeft + 4, jibY), craneLatticePaint);
    canvas.drawLine(apexPoint, Offset(craneX + 50, jibY), craneLatticePaint);
    canvas.drawLine(apexPoint, Offset(jibRight - 10, jibY), craneLatticePaint);

    // Trolley & Hoist Line with Hook
    final trolleyX = craneX + 52;
    canvas.drawRect(Rect.fromLTWH(trolleyX - 4, jibY - 2, 8, 6), Paint()..color = const Color(0xFF1E3A8A));
    canvas.drawLine(Offset(trolleyX, jibY + 4), Offset(trolleyX, jibY + 45), craneLatticePaint..strokeWidth = 1.4);
    // Hook
    final hookY = jibY + 45;
    canvas.drawArc(
      Rect.fromCircle(center: Offset(trolleyX, hookY + 4), radius: 4),
      0,
      3.14,
      false,
      cranePaint..strokeWidth = 2,
    );

    // 5. Green Foliage / Trees at Bottom Ground
    final foliagePaint = Paint()..color = const Color(0xFF15803D).withValues(alpha: 0.85);
    final lightFoliagePaint = Paint()..color = const Color(0xFF22C55E).withValues(alpha: 0.9);

    final foliagePath = Path()..moveTo(0, h);
    for (double x = 0; x <= w; x += 18) {
      foliagePath.quadraticBezierTo(x + 9, h - 14, x + 18, h);
    }
    foliagePath.close();
    canvas.drawPath(foliagePath, foliagePaint);

    final lightFoliagePath = Path()..moveTo(0, h);
    for (double x = 8; x <= w; x += 22) {
      lightFoliagePath.quadraticBezierTo(x + 11, h - 8, x + 22, h);
    }
    lightFoliagePath.close();
    canvas.drawPath(lightFoliagePath, lightFoliagePaint);
  }

  void _drawSkyscraper(
    Canvas canvas,
    Rect rect, {
    bool hasPointedSpire = false,
    bool hasCrown = false,
    bool hasAntenna = false,
    bool isHero = false,
    bool isGlassTower = false,
  }) {
    final bodyPaint = Paint()
      ..shader = LinearGradient(
        colors: [
          const Color(0xFFFFFFFF),
          const Color(0xFFE2E8F0),
          isGlassTower ? const Color(0xFFBFDBFE) : const Color(0xFFCBD5E1),
        ],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(rect);

    final strokePaint = Paint()
      ..color = const Color(0xFF64748B).withValues(alpha: 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final windowPaint = Paint()
      ..color = isGlassTower
          ? const Color(0xFF3B82F6).withValues(alpha: 0.35)
          : const Color(0xFF475569).withValues(alpha: 0.25);

    // Building Body
    canvas.drawRect(rect, bodyPaint);
    canvas.drawRect(rect, strokePaint);

    // Architectural Tops
    if (hasPointedSpire) {
      final spirePath = Path()
        ..moveTo(rect.left, rect.top)
        ..lineTo(rect.center.dx, rect.top - (rect.width * 0.45))
        ..lineTo(rect.right, rect.top)
        ..close();
      canvas.drawPath(spirePath, bodyPaint);
      canvas.drawPath(spirePath, strokePaint);

      // Antenna Needle
      canvas.drawLine(
        Offset(rect.center.dx, rect.top - (rect.width * 0.45)),
        Offset(rect.center.dx, rect.top - (rect.width * 0.45) - 14),
        Paint()..color = const Color(0xFF475569)..strokeWidth = 1.5,
      );
    } else if (hasCrown) {
      final crownRect = Rect.fromLTRB(
        rect.left + 4,
        rect.top - 8,
        rect.right - 4,
        rect.top,
      );
      canvas.drawRect(crownRect, bodyPaint);
      canvas.drawRect(crownRect, strokePaint);
    } else if (hasAntenna) {
      canvas.drawLine(
        Offset(rect.center.dx, rect.top),
        Offset(rect.center.dx, rect.top - 18),
        Paint()..color = const Color(0xFF475569)..strokeWidth = 1.5,
      );
    }

    // Windows Grid / Vertical Slits
    const int cols = 4;
    final colW = rect.width / cols;
    for (double y = rect.top + 8; y < rect.bottom - 10; y += 8) {
      for (int c = 0; c < cols; c++) {
        final wx = rect.left + c * colW + 2;
        canvas.drawRect(Rect.fromLTWH(wx, y, colW - 4, 4), windowPaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
