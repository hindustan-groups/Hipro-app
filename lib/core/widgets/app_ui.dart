import 'dart:async';
import 'package:flutter/material.dart';

import '../../config/theme/app_colors.dart';

class HiproMark extends StatelessWidget {
  const HiproMark({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: compact ? 34 : 40,
          height: compact ? 34 : 40,
          decoration: BoxDecoration(
            gradient: AppColors.brandGradient,
            borderRadius: BorderRadius.circular(compact ? 11 : 13),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.2),
                blurRadius: 18,
                offset: const Offset(0, 7),
              ),
            ],
          ),
          child: Icon(
            Icons.home_repair_service_rounded,
            color: Colors.white,
            size: compact ? 19 : 22,
          ),
        ),
        if (!compact) ...[
          const SizedBox(width: 11),
          const Text(
            'HIPRO',
            style: TextStyle(
              color: AppColors.primaryDark,
              fontSize: 17,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.8,
            ),
          ),
        ],
      ],
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              if (subtitle != null) ...[
                const SizedBox(height: 4),
                Text(
                  subtitle!,
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 12,
                  ),
                ),
              ],
            ],
          ),
        ),
        if (actionLabel != null)
          TextButton(onPressed: onAction, child: Text(actionLabel!)),
      ],
    );
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill({
    super.key,
    required this.label,
    required this.color,
    this.icon,
  });

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.24)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, color: color, size: 13),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class AppIconButton extends StatelessWidget {
  const AppIconButton({
    super.key,
    required this.icon,
    required this.onPressed,
    this.badge = false,
  });

  final IconData icon;
  final VoidCallback onPressed;
  final bool badge;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton.filled(
          onPressed: onPressed,
          style: IconButton.styleFrom(
            backgroundColor: AppColors.surface,
            foregroundColor: AppColors.textSecondary,
            side: const BorderSide(color: AppColors.borderSubtle),
          ),
          icon: Icon(icon, size: 20),
        ),
        if (badge)
          Positioned(
            right: 4,
            top: 4,
            child: Container(
              width: 7,
              height: 7,
              decoration: const BoxDecoration(
                color: AppColors.accent,
                shape: BoxShape.circle,
              ),
            ),
          ),
      ],
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: AppColors.primaryLight, size: 32),
            ),
            const SizedBox(height: 18),
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}

class AppToast {
  static OverlayEntry? _currentEntry;

  static void hide() {
    if (_currentEntry != null && _currentEntry!.mounted) {
      _currentEntry?.remove();
    }
    _currentEntry = null;
  }

  static void showChatNotification(
    BuildContext context, {
    required String title,
    required String message,
    required VoidCallback onTapChat,
  }) {
    show(
      context,
      title: title,
      message: message,
      actionLabel: 'Reply',
      onAction: onTapChat,
      onTap: onTapChat,
      duration: const Duration(seconds: 6),
      isChat: true,
    );
  }

  static void show(
    BuildContext context, {
    String? title,
    required String message,
    String? actionLabel,
    VoidCallback? onAction,
    VoidCallback? onTap,
    bool isError = false,
    bool isChat = false,
    Duration duration = const Duration(milliseconds: 1400),
  }) {
    // 1. Remove previous toast if any
    hide();

    // 2. Clean diagnostic / technical error strings
    final formattedMessage = isError ? cleanErrorMessage(message) : message;

    String? displayTitle = title;
    String displayBody = formattedMessage;
    if (displayTitle == null && displayBody.contains('\n')) {
      final parts = displayBody.split('\n');
      displayTitle = parts.first.trim();
      displayBody = parts.sublist(1).join('\n').trim();
    }

    // 3. Always show top-positioned floating overlay toast (1 to 1.5 seconds)
    final overlay = Overlay.maybeOf(context, rootOverlay: true);
    if (overlay != null) {
      late OverlayEntry entry;
      entry = OverlayEntry(
        builder: (ctx) => _ToastOverlayWidget(
          title: displayTitle,
          message: displayBody,
          actionLabel: actionLabel,
          onAction: onAction,
          onTap: onTap,
          isError: isError,
          isChat: isChat,
          duration: duration,
          onDismiss: () {
            if (entry.mounted) {
              entry.remove();
            }
            if (_currentEntry == entry) {
              _currentEntry = null;
            }
          },
        ),
      );

      _currentEntry = entry;
      overlay.insert(entry);
      return;
    }

    // Fallback only if no overlay found in widget tree
    final scaffold = ScaffoldMessenger.maybeOf(context);
    if (scaffold != null) {
      scaffold.clearSnackBars();
      scaffold.showSnackBar(
        SnackBar(
          elevation: 5,
          backgroundColor: isError ? const Color(0xFFFEF2F2) : Colors.white,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: BorderSide(
              color: isError ? const Color(0xFFFECACA) : const Color(0xFFCBD5E1),
              width: 1.2,
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          duration: duration,
          content: InkWell(
            onTap: onTap != null
                ? () {
                    scaffold.hideCurrentSnackBar();
                    onTap();
                  }
                : null,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: isError
                        ? const Color(0xFFEF4444).withValues(alpha: 0.15)
                        : const Color(0xFF1864E8).withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isError
                        ? Icons.error_outline_rounded
                        : (isChat ? Icons.chat_bubble_rounded : Icons.check_circle_outline_rounded),
                    color: isError ? const Color(0xFFDC2626) : const Color(0xFF1864E8),
                    size: 18,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (displayTitle != null && displayTitle.isNotEmpty) ...[
                        Text(
                          displayTitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 2),
                      ],
                      Text(
                        displayBody,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: const Color(0xFF334155),
                          fontSize: 12,
                          fontWeight: displayTitle != null ? FontWeight.w500 : FontWeight.w600,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                if (actionLabel != null && onAction != null) ...[
                  const SizedBox(width: 10),
                  Material(
                    color: const Color(0xFF1864E8),
                    borderRadius: BorderRadius.circular(8),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(8),
                      onTap: () {
                        scaffold.hideCurrentSnackBar();
                        onAction();
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        child: Text(
                          actionLabel,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      );
    }
  }

  /// Cleans raw Dio / HTTP / socket error messages into user-friendly text
  static String cleanErrorMessage(dynamic error) {
    if (error == null) return 'An unexpected error occurred.';
    final str = error.toString().trim();
    if (str.isEmpty) return 'An unexpected error occurred.';

    String prefix = '';
    String content = str;
    if (str.contains(': ')) {
      final colonIndex = str.indexOf(': ');
      final possiblePrefix = str.substring(0, colonIndex).trim();
      if (!possiblePrefix.contains('DioException') && !possiblePrefix.contains('Exception')) {
        prefix = '$possiblePrefix: ';
        content = str.substring(colonIndex + 2).trim();
      }
    }

    if (content.contains('status code of 404') || content.contains('404 Not Found') || content.contains('status 404')) {
      return '${prefix}Service temporarily unavailable (404). Please try again shortly.';
    }
    if (content.contains('status code of 500') || content.contains('status code of 502') || content.contains('status code of 503')) {
      return '${prefix}Server error occurred. Please try again in a few moments.';
    }
    if (content.contains('status code of 401') || content.contains('status code of 403')) {
      return '${prefix}Session expired. Please log in again to continue.';
    }
    if (content.contains('SocketException') ||
        content.contains('Failed host lookup') ||
        content.contains('Network is unreachable') ||
        content.contains('connection refused') ||
        content.contains('connectTimeout') ||
        content.contains('receiveTimeout')) {
      return '${prefix}Network error. Please check your internet connection.';
    }

    if (content.startsWith('Exception: ')) {
      content = content.substring('Exception: '.length);
    }
    if (content.length > 150) {
      content = '${content.substring(0, 147)}...';
    }

    return '$prefix$content';
  }
}

class _ToastOverlayWidget extends StatefulWidget {
  final String? title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final VoidCallback? onTap;
  final bool isError;
  final bool isChat;
  final Duration duration;
  final VoidCallback onDismiss;

  const _ToastOverlayWidget({
    this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
    this.onTap,
    this.isError = false,
    this.isChat = false,
    required this.duration,
    required this.onDismiss,
  });

  @override
  State<_ToastOverlayWidget> createState() => _ToastOverlayWidgetState();
}

class _ToastOverlayWidgetState extends State<_ToastOverlayWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<Offset> _offsetAnimation;
  late final Animation<double> _fadeAnimation;
  Timer? _dismissTimer;
  bool _isDismissing = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 220),
    );

    _offsetAnimation = Tween<Offset>(
      begin: const Offset(0, -0.6),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
      reverseCurve: Curves.easeInCubic,
    ));

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
      reverseCurve: Curves.easeIn,
    );

    _controller.forward();

    _dismissTimer = Timer(widget.duration, () {
      _dismiss();
    });
  }

  void _dismiss() {
    if (_isDismissing) return;
    _isDismissing = true;
    _dismissTimer?.cancel();
    if (!mounted) {
      widget.onDismiss();
      return;
    }
    _controller.reverse().then((_) {
      if (mounted) {
        widget.onDismiss();
      }
    });
  }

  @override
  void dispose() {
    _dismissTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    // Respect device notch / dynamic island / status bar safely
    final topPadding = mediaQuery.padding.top + 8;

    return Positioned(
      top: topPadding,
      left: 14,
      right: 14,
      child: Material(
        type: MaterialType.transparency,
        child: SlideTransition(
          position: _offsetAnimation,
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: GestureDetector(
              onTap: widget.onTap != null
                  ? () {
                      _dismiss();
                      widget.onTap!();
                    }
                  : null,
              onVerticalDragUpdate: (details) {
                if (details.primaryDelta != null && details.primaryDelta! < -3) {
                  _dismiss();
                }
              },
              child: Container(
                constraints: const BoxConstraints(maxHeight: 220),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: widget.isError
                      ? const Color(0xFFFEF2F2)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: widget.isError
                        ? const Color(0xFFFECACA)
                        : const Color(0xFFE2E8F0),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.12),
                      blurRadius: 18,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: widget.isError
                            ? const Color(0xFFEF4444).withValues(alpha: 0.15)
                            : const Color(0xFF1864E8).withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        widget.isError
                            ? Icons.error_outline_rounded
                            : (widget.isChat
                                ? Icons.chat_bubble_rounded
                                : Icons.check_circle_outline_rounded),
                        color: widget.isError
                            ? const Color(0xFFDC2626)
                            : const Color(0xFF1864E8),
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (widget.title != null && widget.title!.isNotEmpty) ...[
                            Text(
                              widget.title!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF0F172A), // Deep Slate-900 (High contrast bold text)
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 2),
                          ],
                          Text(
                            widget.message,
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: const Color(0xFF334155), // Charcoal slate-700 (Crisp & readable)
                              fontSize: 12,
                              fontWeight: widget.title != null ? FontWeight.w500 : FontWeight.w600,
                              height: 1.35,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (widget.actionLabel != null && widget.onAction != null) ...[
                      const SizedBox(width: 8),
                      Material(
                        color: const Color(0xFF1864E8),
                        borderRadius: BorderRadius.circular(8),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(8),
                          onTap: () {
                            _dismiss();
                            widget.onAction!();
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 7),
                            child: Text(
                              widget.actionLabel!,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(width: 4),
                    InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: _dismiss,
                      child: const Padding(
                        padding: EdgeInsets.all(4),
                        child: Icon(
                          Icons.close_rounded,
                          color: Color(0xFF64748B),
                          size: 18,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

