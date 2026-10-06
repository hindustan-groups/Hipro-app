import 'package:flutter/material.dart';

class HiproLogo extends StatelessWidget {
  const HiproLogo({
    super.key,
    this.size = 42,
    this.isLight = false,
    this.showText = true,
    this.fontSize = 24,
  });

  final double size;
  final bool isLight;
  final bool showText;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    final iconColor = isLight ? Colors.white : const Color(0xFF1864E8);
    final accentIconColor = isLight ? const Color(0xFF93C5FD) : const Color(0xFF2563EB);
    final textColor = isLight ? Colors.white : const Color(0xFF0F172A);

    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Stylized 'H' symbol matching the brand design
        SizedBox(
          width: size,
          height: size,
          child: CustomPaint(
            painter: _HiproLogoPainter(
              leftColor: iconColor,
              rightColor: accentIconColor,
            ),
          ),
        ),
        if (showText) ...[
          SizedBox(width: size * 0.26),
          Text(
            'Hipro',
            style: TextStyle(
              color: textColor,
              fontSize: fontSize,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
              fontFamily: 'sans-serif',
            ),
          ),
        ],
      ],
    );
  }
}

class _HiproLogoPainter extends CustomPainter {
  final Color leftColor;
  final Color rightColor;

  _HiproLogoPainter({required this.leftColor, required this.rightColor});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final paint1 = Paint()
      ..color = leftColor
      ..style = PaintingStyle.fill;

    final paint2 = Paint()
      ..color = rightColor
      ..style = PaintingStyle.fill;

    // Left vertical bar with rounded corners
    final leftRRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, h * 0.08, w * 0.30, h * 0.84),
      Radius.circular(w * 0.12),
    );
    canvas.drawRRect(leftRRect, paint1);

    // Right vertical bar with top angle
    final rightRRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(w * 0.70, h * 0.08, w * 0.30, h * 0.84),
      Radius.circular(w * 0.12),
    );
    canvas.drawRRect(rightRRect, paint2);

    // Middle connecting bridge / chevron
    final bridgePath = Path()
      ..moveTo(w * 0.28, h * 0.40)
      ..lineTo(w * 0.52, h * 0.30)
      ..lineTo(w * 0.72, h * 0.44)
      ..lineTo(w * 0.72, h * 0.62)
      ..lineTo(w * 0.52, h * 0.72)
      ..lineTo(w * 0.28, h * 0.58)
      ..close();
    canvas.drawPath(bridgePath, paint1);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
