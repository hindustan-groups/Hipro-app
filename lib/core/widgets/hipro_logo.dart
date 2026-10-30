import 'package:flutter/material.dart';

/// Authentic Hipro brand logo widget matching the corporate identity:
/// - Stylized architectural 'H' symbol
/// - Deep royal blue pillar and crossbar
/// - Slate gray top-right skyscraper tower
/// - Silhouetted house with 4-pane window cutout
class HiproLogo extends StatelessWidget {
  const HiproLogo({
    super.key,
    this.size = 42,
    this.isLight = false,
    this.showText = true,
    this.fontSize = 24,
    this.houseColor,
  });

  final double size;
  final bool isLight;
  final bool showText;
  final double fontSize;
  final Color? houseColor;

  @override
  Widget build(BuildContext context) {
    final primaryBlue = isLight ? Colors.white : const Color(0xFF0D5BC6);
    final slateGray = isLight ? const Color(0xFF94A3B8) : const Color(0xFF707F8E);
    final houseFill = houseColor ?? (isLight ? const Color(0xFF0F172A) : Colors.white);
    final windowColor = isLight ? Colors.white70 : const Color(0xFF1E293B);
    final textColor = isLight ? Colors.white : const Color(0xFF0F172A);

    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Scaled custom painted architectural H logo
        SizedBox(
          width: size,
          height: size,
          child: CustomPaint(
            painter: _HiproLogoPainter(
              primaryColor: primaryBlue,
              accentColor: slateGray,
              houseColor: houseFill,
              windowColor: windowColor,
            ),
          ),
        ),
        if (showText) ...[
          SizedBox(width: size * 0.24),
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Hipro',
                style: TextStyle(
                  color: textColor,
                  fontSize: fontSize,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.8,
                  height: 1.05,
                  fontFamily: 'sans-serif',
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

class _HiproLogoPainter extends CustomPainter {
  final Color primaryColor;
  final Color accentColor;
  final Color houseColor;
  final Color windowColor;

  _HiproLogoPainter({
    required this.primaryColor,
    required this.accentColor,
    required this.houseColor,
    required this.windowColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Coordinate space normalized to 500 x 500
    final sx = size.width / 500.0;
    final sy = size.height / 500.0;

    final accentPaint = Paint()
      ..color = accentColor
      ..style = PaintingStyle.fill;

    final primaryPaint = Paint()
      ..color = primaryColor
      ..style = PaintingStyle.fill;

    final housePaint = Paint()
      ..color = houseColor
      ..style = PaintingStyle.fill;

    final windowPaint = Paint()
      ..color = windowColor
      ..style = PaintingStyle.fill;

    // 1. Top Right Skyscraper Tower (Slate Gray)
    final skyscraperPath = Path()
      ..moveTo(310 * sx, 65 * sy)
      ..lineTo(410 * sx, 120 * sy)
      ..lineTo(410 * sx, 305 * sy)
      ..lineTo(310 * sx, 250 * sy)
      ..close();
    canvas.drawPath(skyscraperPath, accentPaint);

    // 2. Main Blue 'H' Body
    final hBodyPath = Path()
      ..moveTo(180 * sx, 85 * sy)
      ..lineTo(75 * sx, 145 * sy)
      ..lineTo(75 * sx, 445 * sy)
      ..quadraticBezierTo(75 * sx, 470 * sy, 105 * sx, 470 * sy)
      ..lineTo(180 * sx, 470 * sy)
      ..lineTo(180 * sx, 340 * sy)
      ..lineTo(250 * sx, 290 * sy)
      ..lineTo(355 * sx, 365 * sy)
      ..lineTo(320 * sx, 365 * sy)
      ..lineTo(320 * sx, 470 * sy)
      ..lineTo(410 * sx, 470 * sy)
      ..lineTo(410 * sx, 305 * sy)
      ..lineTo(310 * sx, 250 * sy)
      ..lineTo(250 * sx, 215 * sy)
      ..lineTo(180 * sx, 265 * sy)
      ..close();
    canvas.drawPath(hBodyPath, primaryPaint);

    // 3. Center House Silhouette (Crisp White / House Color)
    final housePath = Path()
      ..moveTo(180 * sx, 470 * sy)
      ..lineTo(180 * sx, 340 * sy)
      ..lineTo(250 * sx, 290 * sy)
      ..lineTo(355 * sx, 365 * sy)
      ..lineTo(320 * sx, 365 * sy)
      ..lineTo(320 * sx, 470 * sy)
      ..close();
    canvas.drawPath(housePath, housePaint);

    // 4. Architectural 4-Pane Window (Dark Slate)
    final double paneW = 24 * sx;
    final double paneH = 24 * sy;
    final double radius = 2 * sx;

    // Top-Left Pane
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(221 * sx, 360 * sy, paneW, paneH),
        Radius.circular(radius),
      ),
      windowPaint,
    );

    // Top-Right Pane
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(255 * sx, 360 * sy, paneW, paneH),
        Radius.circular(radius),
      ),
      windowPaint,
    );

    // Bottom-Left Pane
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(221 * sx, 394 * sy, paneW, paneH),
        Radius.circular(radius),
      ),
      windowPaint,
    );

    // Bottom-Right Pane
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(255 * sx, 394 * sy, paneW, paneH),
        Radius.circular(radius),
      ),
      windowPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _HiproLogoPainter oldDelegate) {
    return oldDelegate.primaryColor != primaryColor ||
        oldDelegate.accentColor != accentColor ||
        oldDelegate.houseColor != houseColor ||
        oldDelegate.windowColor != windowColor;
  }
}
