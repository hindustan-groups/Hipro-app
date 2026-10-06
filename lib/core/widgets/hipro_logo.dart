import 'package:flutter/material.dart';

class HiproLogo extends StatelessWidget {
  const HiproLogo({
    super.key,
    this.size = 46,
    this.isLight = false,
    this.showText = true,
    this.fontSize = 26,
  });

  final double size;
  final bool isLight;
  final bool showText;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    final leftColor = isLight ? Colors.white : const Color(0xFF38BDF8);
    final rightColor = isLight ? const Color(0xFF93C5FD) : const Color(0xFF1D4ED8);
    final textColor = isLight ? Colors.white : const Color(0xFF0F172A);

    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Stylized 3D-angled 'H' mark
        SizedBox(
          width: size,
          height: size,
          child: CustomPaint(
            painter: _HiproLogoPainter(
              leftColor: leftColor,
              rightColor: rightColor,
            ),
          ),
        ),
        if (showText) ...[
          SizedBox(width: size * 0.24),
          Text(
            'Hipro',
            style: TextStyle(
              color: textColor,
              fontSize: fontSize,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.6,
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

    // Left cyan vertical pillar (with chamfered top)
    final leftPath = Path()
      ..moveTo(w * 0.04, h * 0.22)
      ..lineTo(w * 0.32, h * 0.08)
      ..lineTo(w * 0.32, h * 0.88)
      ..lineTo(w * 0.04, h * 0.74)
      ..close();
    canvas.drawPath(leftPath, Paint()..color = leftColor);

    // Right royal blue vertical pillar (with chamfered top)
    final rightPath = Path()
      ..moveTo(w * 0.68, h * 0.08)
      ..lineTo(w * 0.96, h * 0.22)
      ..lineTo(w * 0.96, h * 0.74)
      ..lineTo(w * 0.68, h * 0.88)
      ..close();
    canvas.drawPath(rightPath, Paint()..color = rightColor);

    // Middle connecting 3D isometric bridge
    final bridgePath = Path()
      ..moveTo(w * 0.32, h * 0.40)
      ..lineTo(w * 0.68, h * 0.28)
      ..lineTo(w * 0.68, h * 0.52)
      ..lineTo(w * 0.32, h * 0.64)
      ..close();
    canvas.drawPath(
      bridgePath,
      Paint()
        ..shader = LinearGradient(
          colors: [leftColor, rightColor],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ).createShader(Rect.fromLTWH(w * 0.32, h * 0.28, w * 0.36, h * 0.36)),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
