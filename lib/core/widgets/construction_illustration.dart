import 'package:flutter/material.dart';

class ConstructionIllustration extends StatelessWidget {
  const ConstructionIllustration({
    super.key,
    this.height = 220,
    this.isDark = true,
  });

  final double height;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: CustomPaint(
        painter: _ConstructionPainter(isDark: isDark),
      ),
    );
  }
}

class _ConstructionPainter extends CustomPainter {
  final bool isDark;

  _ConstructionPainter({required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final primaryColor = isDark
        ? Colors.white.withValues(alpha: 0.85)
        : const Color(0xFF1864E8).withValues(alpha: 0.85);
    final secondaryColor = isDark
        ? Colors.white.withValues(alpha: 0.35)
        : const Color(0xFF93C5FD).withValues(alpha: 0.6);
    final craneColor = isDark
        ? const Color(0xFF60A5FA)
        : const Color(0xFF2563EB);

    final linePaint = Paint()
      ..color = primaryColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final thinLinePaint = Paint()
      ..color = secondaryColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    final fillPaint = Paint()
      ..color = isDark
          ? Colors.white.withValues(alpha: 0.08)
          : const Color(0xFFEBF2FE)
      ..style = PaintingStyle.fill;

    // 1. Center Construction Building (Under Construction Grid Structure)
    final buildingLeft = w * 0.22;
    final buildingWidth = w * 0.44;
    final buildingTop = h * 0.18;
    final buildingBottom = h * 0.95;

    // Building body
    final buildingRect = Rect.fromLTRB(
      buildingLeft,
      buildingTop,
      buildingLeft + buildingWidth,
      buildingBottom,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(buildingRect, const Radius.circular(8)),
      fillPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(buildingRect, const Radius.circular(8)),
      linePaint,
    );

    // Floor levels (horizontal grid lines)
    const int floors = 5;
    for (int i = 1; i < floors; i++) {
      final y = buildingTop + (buildingBottom - buildingTop) * (i / floors);
      canvas.drawLine(
        Offset(buildingLeft, y),
        Offset(buildingLeft + buildingWidth, y),
        linePaint,
      );
    }

    // Vertical column beams
    const int columns = 4;
    for (int i = 1; i < columns; i++) {
      final x = buildingLeft + buildingWidth * (i / columns);
      canvas.drawLine(
        Offset(x, buildingTop),
        Offset(x, buildingBottom),
        linePaint,
      );
    }

    // Diagonal structural cross braces (X braces for construction effect)
    for (int i = 0; i < floors - 1; i++) {
      final y1 = buildingTop + (buildingBottom - buildingTop) * (i / floors);
      final y2 = buildingTop + (buildingBottom - buildingTop) * ((i + 1) / floors);
      for (int j = 0; j < columns - 1; j++) {
        final x1 = buildingLeft + buildingWidth * (j / columns);
        final x2 = buildingLeft + buildingWidth * ((j + 1) / columns);

        if ((i + j) % 2 == 0) {
          canvas.drawLine(Offset(x1, y1), Offset(x2, y2), thinLinePaint);
        } else {
          canvas.drawLine(Offset(x1, y2), Offset(x2, y1), thinLinePaint);
        }
      }
    }

    // 2. Left Smaller Building
    final leftBldgRect = Rect.fromLTRB(
      w * 0.05,
      h * 0.42,
      buildingLeft - w * 0.03,
      buildingBottom,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(leftBldgRect, const Radius.circular(6)),
      fillPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(leftBldgRect, const Radius.circular(6)),
      linePaint,
    );

    // Windows in left building
    for (double y = h * 0.48; y < buildingBottom - 15; y += 18) {
      canvas.drawLine(
        Offset(w * 0.08, y),
        Offset(buildingLeft - w * 0.06, y),
        thinLinePaint,
      );
    }

    // 3. Right Tower & Construction Crane
    final rightBldgLeft = buildingLeft + buildingWidth + w * 0.03;
    final rightBldgRight = w * 0.95;
    final rightBldgRect = Rect.fromLTRB(
      rightBldgLeft,
      h * 0.35,
      rightBldgRight,
      buildingBottom,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(rightBldgRect, const Radius.circular(6)),
      fillPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(rightBldgRect, const Radius.circular(6)),
      linePaint,
    );

    // Crane Mast (Vertical Tower)
    final craneX = rightBldgLeft + (rightBldgRight - rightBldgLeft) * 0.45;
    final craneBaseY = h * 0.35;
    final craneTopY = h * 0.04;

    final cranePaint = Paint()
      ..color = craneColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2;

    final craneThinPaint = Paint()
      ..color = craneColor.withValues(alpha: 0.6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    // Crane vertical mast columns
    const double mastWidth = 10;
    canvas.drawLine(
      Offset(craneX - mastWidth / 2, craneBaseY),
      Offset(craneX - mastWidth / 2, craneTopY),
      cranePaint,
    );
    canvas.drawLine(
      Offset(craneX + mastWidth / 2, craneBaseY),
      Offset(craneX + mastWidth / 2, craneTopY),
      cranePaint,
    );

    // Crane mast lattice diagonals
    for (double y = craneTopY; y < craneBaseY; y += 12) {
      canvas.drawLine(
        Offset(craneX - mastWidth / 2, y),
        Offset(craneX + mastWidth / 2, y + 12),
        craneThinPaint,
      );
    }

    // Crane horizontal Jib (Boom)
    final jibY = craneTopY + 8;
    final jibLeft = craneX - 25; // Counter jib
    final jibRight = craneX + 55; // Main jib
    canvas.drawLine(Offset(jibLeft, jibY), Offset(jibRight, jibY), cranePaint);

    // Crane apex top tower & tie wires
    final apexPoint = Offset(craneX, craneTopY - 14);
    canvas.drawLine(Offset(craneX, craneTopY), apexPoint, cranePaint);
    canvas.drawLine(apexPoint, Offset(jibLeft, jibY), craneThinPaint);
    canvas.drawLine(apexPoint, Offset(jibRight * 0.8, jibY), craneThinPaint);

    // Crane hook hoist line
    final hookX = craneX + 38;
    canvas.drawLine(
      Offset(hookX, jibY),
      Offset(hookX, jibY + 32),
      craneThinPaint,
    );
    canvas.drawCircle(
      Offset(hookX, jibY + 34),
      3,
      Paint()..color = craneColor,
    );

    // Ground line
    canvas.drawLine(
      Offset(0, buildingBottom),
      Offset(w, buildingBottom),
      linePaint..strokeWidth = 2.5,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class CitySkylineIllustration extends StatelessWidget {
  const CitySkylineIllustration({
    super.key,
    this.height = 110,
    this.isDark = false,
  });

  final double height;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: CustomPaint(
        painter: _CitySkylinePainter(isDark: isDark),
      ),
    );
  }
}

class _CitySkylinePainter extends CustomPainter {
  final bool isDark;

  _CitySkylinePainter({required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final primaryColor = isDark
        ? Colors.white.withValues(alpha: 0.25)
        : const Color(0xFF1864E8).withValues(alpha: 0.22);
    final secondaryColor = isDark
        ? Colors.white.withValues(alpha: 0.12)
        : const Color(0xFF60A5FA).withValues(alpha: 0.15);
    final strokeColor = isDark
        ? Colors.white.withValues(alpha: 0.45)
        : const Color(0xFF1864E8).withValues(alpha: 0.45);

    final fillPaint1 = Paint()..color = secondaryColor;
    final fillPaint2 = Paint()..color = primaryColor;
    final strokePaint = Paint()
      ..color = strokeColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    // Layer 1: Background Silhouette Buildings
    final bgPath = Path()
      ..moveTo(0, h)
      ..lineTo(0, h * 0.55)
      ..lineTo(w * 0.08, h * 0.55)
      ..lineTo(w * 0.08, h * 0.35)
      ..lineTo(w * 0.16, h * 0.35)
      ..lineTo(w * 0.16, h * 0.60)
      ..lineTo(w * 0.24, h * 0.60)
      ..lineTo(w * 0.24, h * 0.25)
      ..lineTo(w * 0.32, h * 0.25)
      ..lineTo(w * 0.32, h * 0.50)
      ..lineTo(w * 0.44, h * 0.50)
      ..lineTo(w * 0.44, h * 0.18)
      ..lineTo(w * 0.52, h * 0.18)
      ..lineTo(w * 0.52, h * 0.45)
      ..lineTo(w * 0.64, h * 0.45)
      ..lineTo(w * 0.64, h * 0.28)
      ..lineTo(w * 0.72, h * 0.28)
      ..lineTo(w * 0.72, h * 0.55)
      ..lineTo(w * 0.84, h * 0.55)
      ..lineTo(w * 0.84, h * 0.38)
      ..lineTo(w * 0.92, h * 0.38)
      ..lineTo(w * 0.92, h * 0.65)
      ..lineTo(w, h * 0.65)
      ..lineTo(w, h)
      ..close();
    canvas.drawPath(bgPath, fillPaint1);

    // Layer 2: Foreground Crisp Outlined Skyline with Crane
    final fgBuildings = [
      Rect.fromLTRB(w * 0.04, h * 0.48, w * 0.14, h),
      Rect.fromLTRB(w * 0.18, h * 0.32, w * 0.30, h),
      Rect.fromLTRB(w * 0.35, h * 0.42, w * 0.48, h),
      Rect.fromLTRB(w * 0.54, h * 0.22, w * 0.66, h),
      Rect.fromLTRB(w * 0.70, h * 0.40, w * 0.82, h),
      Rect.fromLTRB(w * 0.86, h * 0.52, w * 0.96, h),
    ];

    for (final rect in fgBuildings) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, const Radius.circular(4)),
        fillPaint2,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, const Radius.circular(4)),
        strokePaint,
      );

      // Window grid slits
      for (double y = rect.top + 10; y < rect.bottom - 10; y += 12) {
        canvas.drawLine(
          Offset(rect.left + 5, y),
          Offset(rect.right - 5, y),
          strokePaint..strokeWidth = 0.8,
        );
      }
    }

    // Skyline Construction Crane
    final craneX = w * 0.60;
    final craneTop = h * 0.06;
    final cranePaint = Paint()
      ..color = isDark ? const Color(0xFF93C5FD) : const Color(0xFF1864E8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8;

    canvas.drawLine(Offset(craneX, h * 0.22), Offset(craneX, craneTop), cranePaint);
    canvas.drawLine(Offset(craneX - 16, craneTop + 6), Offset(craneX + 38, craneTop + 6), cranePaint);
    canvas.drawLine(Offset(craneX, craneTop - 4), Offset(craneX - 16, craneTop + 6), cranePaint..strokeWidth = 1);
    canvas.drawLine(Offset(craneX, craneTop - 4), Offset(craneX + 28, craneTop + 6), cranePaint..strokeWidth = 1);
    canvas.drawLine(Offset(craneX + 25, craneTop + 6), Offset(craneX + 25, craneTop + 24), cranePaint..strokeWidth = 1);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
