import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../network/api_client.dart';
import '../session/user_session.dart';

enum ChatSenderType { customer, ai, agent, system }

class ChatMessage {
  final String? id;
  final String text;
  final ChatSenderType senderType;
  final String? senderName;
  final DateTime time;

  bool get isUser => senderType == ChatSenderType.customer;
  bool get isSystem => senderType == ChatSenderType.system;
  bool get isAgent => senderType == ChatSenderType.agent;
  bool get isAI => senderType == ChatSenderType.ai;

  const ChatMessage({
    this.id,
    required this.text,
    required this.senderType,
    this.senderName,
    required this.time,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    final rawSender = (json['senderType'] ?? json['sender'] ?? 'AI').toString().toUpperCase();
    ChatSenderType type = ChatSenderType.ai;
    if (rawSender == 'CUSTOMER' || rawSender == 'USER') {
      type = ChatSenderType.customer;
    } else if (rawSender == 'AGENT') {
      type = ChatSenderType.agent;
    } else if (rawSender == 'SYSTEM') {
      type = ChatSenderType.system;
    }

    DateTime dt = DateTime.now();
    final rawTime = json['createdAt'] ?? json['created_at'];
    if (rawTime != null) {
      try {
        dt = DateTime.parse(rawTime.toString()).toLocal();
      } catch (_) {}
    }

    return ChatMessage(
      id: json['id']?.toString(),
      text: json['content']?.toString() ?? json['text']?.toString() ?? '',
      senderType: type,
      senderName: json['senderName']?.toString(),
      time: dt,
    );
  }
}

class ChatSheet extends StatefulWidget {
  final String? threadId;
  final String title;
  final String subtitle;
  final String contextType; // 'SERVICE', 'REQUEST', 'QUOTATION', 'GENERAL'
  final String? contextTag;
  final String? quoteNumber;
  final String? requestNumber;
  final num? amount;

  const ChatSheet({
    super.key,
    this.threadId,
    this.title = 'Hipro Support Team',
    this.subtitle = 'Official Support Desk',
    this.contextType = 'GENERAL',
    this.contextTag,
    this.quoteNumber,
    this.requestNumber,
    this.amount,
  });

  static Future<void> show(
    BuildContext context, {
    String? threadId,
    String title = 'Hipro Support Team',
    String subtitle = 'Official Support Desk',
    String contextType = 'GENERAL',
    String? contextTag,
    String? quoteNumber,
    String? requestNumber,
    num? amount,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: ChatSheet(
          threadId: threadId,
          title: title,
          subtitle: subtitle,
          contextType: contextType,
          contextTag: contextTag,
          quoteNumber: quoteNumber,
          requestNumber: requestNumber,
          amount: amount,
        ),
      ),
    );
  }

  @override
  State<ChatSheet> createState() => _ChatSheetState();
}

class _ChatSheetState extends State<ChatSheet> with SingleTickerProviderStateMixin {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];

  String? _conversationId;
  String _conversationStatus = 'AI_ACTIVE'; // 'AI_ACTIVE', 'WAITING_FOR_AGENT', 'HUMAN_ACTIVE', 'RESOLVED'
  bool _isLoading = true;
  bool _isSending = false;
  bool _isRequestingHandoff = false;
  Timer? _pollTimer;

  List<String> _quickSuggestions = [];

  @override
  void initState() {
    super.initState();
    _initializeSuggestions();
    _initConversation();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _initializeSuggestions() {
    if (widget.quoteNumber != null) {
      _quickSuggestions = [
        'Can I get an itemized BOQ breakdown?',
        'What are the payment terms?',
        'Talk to assigned engineer',
        'When will work start?',
      ];
    } else if (widget.requestNumber != null) {
      _quickSuggestions = [
        'When will the engineer visit?',
        'Can I reschedule my audit?',
        'Talk to support team',
        'What is included in inspection?',
      ];
    } else if (widget.contextType == 'SERVICE') {
      final sName = widget.contextTag ?? 'this service';
      _quickSuggestions = [
        'What is the visiting charge for $sName?',
        'What materials & methods are used?',
        'Talk to human engineer',
        'Is warranty provided for this work?',
      ];
    } else {
      _quickSuggestions = [
        'What services do you provide in my city?',
        'How much does a site inspection cost?',
        'Talk to a human agent',
        'Check my active booking status',
      ];
    }
  }

  /// Initialize or retrieve the active support conversation from backend
  Future<void> _initConversation() async {
    setState(() => _isLoading = true);
    final session = UserSession();
    final guestId = session.userId ?? 'app_guest_${session.phone ?? 'guest'}';

    try {
      final res = await ApiClient().dio.post(
        '/chat/conversations',
        data: {
          'subject': widget.quoteNumber != null
              ? 'Query regarding Quote #${widget.quoteNumber}'
              : widget.requestNumber != null
                  ? 'Query regarding Request #${widget.requestNumber}'
                  : (widget.contextTag ?? 'Mobile Customer Support'),
          'guestId': guestId,
        },
        options: Options(
          headers: {'x-guest-id': guestId},
          validateStatus: (status) => status != null && status < 500,
        ),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        final conv = res.data['conversation'] as Map<String, dynamic>?;
        if (conv != null && mounted) {
          _conversationId = conv['id']?.toString();
          _conversationStatus = conv['status']?.toString() ?? 'AI_ACTIVE';
          await _fetchMessages(silent: true);
        }
      } else {
        // Fallback for legacy endpoints if needed
        _loadFallbackWelcome();
      }
    } catch (e) {
      debugPrint('[ChatSheet] Init conversation fallback: $e');
      _loadFallbackWelcome();
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
        _startPollTimer();
      }
    }
  }

  void _loadFallbackWelcome() {
    if (_messages.isEmpty) {
      _messages.add(
        ChatMessage(
          text: 'Namaste! Welcome to Hipro Support. I am your AI Support Assistant. How can I assist you with services, rates, or bookings today?',
          senderType: ChatSenderType.ai,
          senderName: 'Hipro AI Assistant',
          time: DateTime.now(),
        ),
      );
    }
  }

  void _startPollTimer() {
    _pollTimer?.cancel();
    // Periodically poll for live agent replies when waiting or in human active mode
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (_conversationId != null && mounted) {
        _fetchMessages(silent: true);
      }
    });
  }

  /// Fetch message history and status
  Future<void> _fetchMessages({bool silent = false}) async {
    if (_conversationId == null) return;
    if (!silent && mounted) {
      setState(() => _isLoading = true);
    }

    final session = UserSession();
    final guestId = session.userId ?? 'app_guest';

    try {
      final res = await ApiClient().dio.get(
        '/chat/conversations/$_conversationId/messages',
        options: Options(
          headers: {'x-guest-id': guestId},
          validateStatus: (status) => status != null && status < 500,
        ),
      );

      if (res.statusCode == 200 && res.data != null && res.data['success'] == true) {
        final conv = res.data['conversation'] as Map<String, dynamic>?;
        final list = res.data['messages'] as List<dynamic>? ?? [];

        if (mounted) {
          if (conv != null) {
            _conversationStatus = conv['status']?.toString() ?? _conversationStatus;
          }

          if (list.isNotEmpty) {
            final parsed = list.map((item) => ChatMessage.fromJson(item as Map<String, dynamic>)).toList();
            final prevCount = _messages.length;
            setState(() {
              _messages.clear();
              _messages.addAll(parsed);
            });
            if (_messages.length != prevCount) {
              _scrollToBottom();
            }
          }
        }
      }
    } catch (_) {
      // Keep existing local list if offline
    } finally {
      if (!silent && mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  /// Send message to backend (Auto-triggers Gemini / Groq / Human Agent)
  Future<void> _sendMessage([String? customText]) async {
    final text = (customText ?? _textController.text).trim();
    if (text.isEmpty || _isSending) return;

    final session = UserSession();
    final guestId = session.userId ?? 'app_guest_${session.phone ?? 'guest'}';

    // Optimistically add customer message to UI
    final userMsg = ChatMessage(
      text: text,
      senderType: ChatSenderType.customer,
      senderName: session.name ?? 'You',
      time: DateTime.now(),
    );

    setState(() {
      _messages.add(userMsg);
      _isSending = true;
    });

    if (customText == null) {
      _textController.clear();
    }
    _scrollToBottom();

    try {
      // Ensure conversation exists
      if (_conversationId == null) {
        await _initConversation();
      }

      final payload = {
        'conversationId': _conversationId,
        'message': text,
        'guestId': guestId,
      };

      final res = await ApiClient().dio.post(
        '/chat/message',
        data: payload,
        options: Options(
          headers: {'x-guest-id': guestId},
          validateStatus: (status) => status != null && status < 500,
        ),
      );

      if (res.statusCode == 200 && res.data != null && res.data['success'] == true) {
        final mode = res.data['mode']?.toString();
        if (mode != null) {
          _conversationStatus = mode;
        }

        // Check if an AI reply was returned directly
        if (res.data['message'] != null) {
          final replyMsg = ChatMessage.fromJson(res.data['message'] as Map<String, dynamic>);
          if (mounted && !_messages.any((m) => m.id == replyMsg.id && replyMsg.id != null)) {
            setState(() {
              _messages.add(replyMsg);
            });
            _scrollToBottom();
          }
        } else if (res.data['escalated'] == true) {
          // Escalated to human support
          setState(() {
            _conversationStatus = 'WAITING_FOR_AGENT';
          });
          _fetchMessages(silent: true);
        }
      }
    } catch (e) {
      debugPrint('[ChatSheet] Send message error: $e');
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }

  /// Request transfer to a human support agent
  Future<void> _requestHumanHandoff() async {
    if (_conversationId == null || _isRequestingHandoff) return;

    setState(() => _isRequestingHandoff = true);
    final session = UserSession();
    final guestId = session.userId ?? 'app_guest';

    try {
      final res = await ApiClient().dio.post(
        '/chat/conversations/$_conversationId/handoff',
        options: Options(
          headers: {'x-guest-id': guestId},
          validateStatus: (status) => status != null && status < 500,
        ),
      );

      if (res.statusCode == 200 && res.data['success'] == true) {
        setState(() {
          _conversationStatus = 'WAITING_FOR_AGENT';
        });
        await _fetchMessages(silent: true);
      }
    } catch (e) {
      debugPrint('[ChatSheet] Handoff error: $e');
    } finally {
      if (mounted) {
        setState(() => _isRequestingHandoff = false);
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent + 60,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _launchPhoneCall() async {
    final uri = Uri.parse('tel:+919462877757');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _launchWhatsApp() async {
    const phone = '919462877757';
    String message = 'Hello Hipro Technical Support, I have a query';
    if (widget.quoteNumber != null) {
      message += ' regarding Quotation #${widget.quoteNumber}';
    } else if (widget.requestNumber != null) {
      message += ' regarding Request #${widget.requestNumber}';
    } else if (widget.contextTag != null) {
      message += ' regarding ${widget.contextTag}';
    }
    final uri = Uri.parse('https://wa.me/$phone?text=${Uri.encodeComponent(message)}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.82,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 10, bottom: 8),
              width: 38,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header (Clean, professional neutral styling without blue accents)
          Container(
            padding: const EdgeInsets.fromLTRB(16, 4, 12, 12),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
            ),
            child: Row(
              children: [
                // Minimalist dark charcoal avatar with status indicator
                Stack(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Center(
                        child: Icon(
                          _conversationStatus == 'HUMAN_ACTIVE'
                              ? Icons.support_agent_rounded
                              : Icons.auto_awesome_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: _conversationStatus == 'WAITING_FOR_AGENT'
                              ? const Color(0xFFF59E0B) // Amber waiting
                              : const Color(0xFF10B981), // Emerald online
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 1.5),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 12),

                // Title & Live Team / AI Status
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              widget.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 14.5,
                                fontWeight: FontWeight.w700,
                                letterSpacing: -0.2,
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.check_circle_rounded,
                            color: Color(0xFF0F172A),
                            size: 14,
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _conversationStatus == 'WAITING_FOR_AGENT'
                                  ? const Color(0xFFF59E0B)
                                  : const Color(0xFF10B981),
                            ),
                          ),
                          const SizedBox(width: 5),
                          Flexible(
                            child: Text(
                              _conversationStatus == 'HUMAN_ACTIVE'
                                  ? 'Hipro Support Team Connected'
                                  : _conversationStatus == 'WAITING_FOR_AGENT'
                                      ? 'Connecting with Team...'
                                      : 'AI Assistant • Instant Answers',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: _conversationStatus == 'WAITING_FOR_AGENT'
                                    ? const Color(0xFFD97706)
                                    : const Color(0xFF475569),
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 6),

                // Call Hotline
                IconButton(
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 34, minHeight: 34),
                  icon: const Icon(Icons.phone_outlined, color: Color(0xFF0F172A), size: 19),
                  tooltip: 'Call Support',
                  onPressed: _launchPhoneCall,
                ),

                const SizedBox(width: 2),

                // WhatsApp Hotline
                IconButton(
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 34, minHeight: 34),
                  icon: const Icon(Icons.chat_outlined, color: Color(0xFF16A34A), size: 19),
                  tooltip: 'WhatsApp Support',
                  onPressed: _launchWhatsApp,
                ),

                const SizedBox(width: 2),

                // Close Button
                IconButton(
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 34, minHeight: 34),
                  icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B), size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),

          // Talk to Human Team Banner (Sleek & prominent secondary strip when AI active)
          if (_conversationStatus == 'AI_ACTIVE')
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
              decoration: const BoxDecoration(
                color: Color(0xFFF8FAFC),
                border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
              ),
              child: Row(
                children: [
                  const Icon(Icons.people_outline_rounded, size: 15, color: Color(0xFF475569)),
                  const SizedBox(width: 6),
                  const Expanded(
                    child: Text(
                      'Need help from an engineer?',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11.5,
                        color: Color(0xFF475569),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  InkWell(
                    onTap: _isRequestingHandoff ? null : _requestHumanHandoff,
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: _isRequestingHandoff
                          ? const SizedBox(
                              width: 12,
                              height: 12,
                              child: CircularProgressIndicator(strokeWidth: 1.5, color: Colors.white),
                            )
                          : const Text(
                              'Support Team',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),

          // Context Topic Strip (if regarding quote or inspection request)
          if (widget.contextTag != null || widget.quoteNumber != null || widget.requestNumber != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
              color: const Color(0xFFF8FAFC),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded, size: 13, color: Color(0xFF64748B)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      widget.quoteNumber != null
                          ? 'Quotation #${widget.quoteNumber}'
                          : widget.requestNumber != null
                              ? 'Request #${widget.requestNumber}'
                              : 'Subject: ${widget.contextTag}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF334155),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: const Text(
                      'Verified Desk',
                      style: TextStyle(
                        color: Color(0xFF475569),
                        fontSize: 9.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),

          // Messages View
          Expanded(
            child: _isLoading && _messages.isEmpty
                ? const Center(
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0F172A)),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];

                      // System message pill (e.g. handoff transfer notice)
                      if (msg.isSystem) {
                        return Center(
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.sync_alt_rounded, size: 13, color: Color(0xFF64748B)),
                                const SizedBox(width: 6),
                                Flexible(
                                  child: Text(
                                    msg.text,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      color: Color(0xFF475569),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      // User Message: Light Gray Box + Sharp Black Text (Clean, Professional, No Blue!)
                      if (msg.isUser) {
                        return Align(
                          alignment: Alignment.centerRight,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            constraints: BoxConstraints(
                              maxWidth: MediaQuery.of(context).size.width * 0.78,
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9), // Light gray box
                              borderRadius: const BorderRadius.only(
                                topLeft: Radius.circular(18),
                                topRight: Radius.circular(18),
                                bottomLeft: Radius.circular(18),
                                bottomRight: Radius.circular(4),
                              ),
                              border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  msg.text,
                                  style: const TextStyle(
                                    color: Color(0xFF0F172A), // Black / Dark Slate text
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w500,
                                    height: 1.4,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  '${msg.time.hour.toString().padLeft(2, '0')}:${msg.time.minute.toString().padLeft(2, '0')}',
                                  style: const TextStyle(
                                    color: Color(0xFF64748B),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w400,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      // Assistant / Agent Message: White Box with crisp outline + Black Text
                      return Align(
                        alignment: Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.of(context).size.width * 0.82,
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: const BorderRadius.only(
                              topLeft: Radius.circular(18),
                              topRight: Radius.circular(18),
                              bottomRight: Radius.circular(18),
                              bottomLeft: Radius.circular(4),
                            ),
                            border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.02),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    msg.isAgent ? Icons.support_agent_rounded : Icons.auto_awesome_rounded,
                                    size: 13,
                                    color: const Color(0xFF475569),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    msg.isAgent
                                        ? 'Hipro Support Team'
                                        : 'Hipro AI Assistant',
                                    style: const TextStyle(
                                      color: Color(0xFF475569),
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                msg.text,
                                style: const TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w400,
                                  height: 1.45,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                '${msg.time.hour.toString().padLeft(2, '0')}:${msg.time.minute.toString().padLeft(2, '0')}',
                                style: const TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 10,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Quick Suggestion Chips (Clean light-gray pills, no blue)
          if (_quickSuggestions.isNotEmpty && _messages.length < 5)
            Container(
              height: 36,
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _quickSuggestions.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final suggestion = _quickSuggestions[index];
                  return GestureDetector(
                    onTap: () => _sendMessage(suggestion),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Text(
                        suggestion,
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: Color(0xFF334155),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

          // Enhanced Input Bar (Ergonomic, modern, no blue, professional black send button)
          SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 12),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                      child: TextField(
                        controller: _textController,
                        textCapitalization: TextCapitalization.sentences,
                        minLines: 1,
                        maxLines: 4,
                        style: const TextStyle(
                          color: Color(0xFF0F172A),
                          fontSize: 13.5,
                          fontWeight: FontWeight.w500,
                        ),
                        decoration: const InputDecoration(
                          hintText: 'Ask anything about services, rates, or bookings...',
                          hintStyle: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 13,
                            fontWeight: FontWeight.normal,
                          ),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(vertical: 8),
                        ),
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Minimalist solid black circular send button
                  GestureDetector(
                    onTap: _isSending ? null : () => _sendMessage(),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A), // Black / Dark Charcoal
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Center(
                        child: _isSending
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(
                                Icons.arrow_upward_rounded,
                                color: Colors.white,
                                size: 20,
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
