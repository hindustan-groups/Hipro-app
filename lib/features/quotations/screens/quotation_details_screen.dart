import 'package:flutter/material.dart';

import '../../../main.dart';
import '../models/quotation_model.dart';

class QuotationDetailsScreen extends StatefulWidget {
  const QuotationDetailsScreen({
    super.key,
    required this.quotation,
    this.projectName = 'Residential Villa',
    this.location = 'Bhilwara, Rajasthan',
  });

  final QuotationModel quotation;
  final String projectName;
  final String location;

  @override
  State<QuotationDetailsScreen> createState() => _QuotationDetailsScreenState();
}

class _QuotationDetailsScreenState extends State<QuotationDetailsScreen> {
  late QuoteDecision _currentStatus;

  @override
  void initState() {
    super.initState();
    _currentStatus = widget.quotation.status;
  }

  void _accept() {
    setState(() => _currentStatus = QuoteDecision.accepted);
    appState.acceptQuotation(widget.quotation.id);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Quotation accepted successfully!'),
        backgroundColor: Color(0xFF10B981),
      ),
    );
  }

  void _reject() {
    setState(() => _currentStatus = QuoteDecision.rejected);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Quotation rejected.'),
        backgroundColor: Color(0xFFEF4444),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final subtotal = widget.quotation.subtotal > 0
        ? widget.quotation.subtotal
        : widget.quotation.grandTotal;
    final gst = widget.quotation.taxGst > 0
        ? widget.quotation.taxGst
        : (subtotal * 0.18).round();
    final total = subtotal + gst;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          color: const Color(0xFF0F172A),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Quotation Details',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 110),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top ID & Date Row + Status Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.quotation.quoteNumber.isNotEmpty
                          ? widget.quotation.quoteNumber
                          : '#Q-001',
                      style: const TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 3),
                    const Text(
                      '12 Apr 2025',
                      style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                _buildStatusBadge(_currentStatus),
              ],
            ),

            const SizedBox(height: 20),

            // Project Property Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEBF2FE),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.apartment_rounded,
                      color: Color(0xFF1864E8),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.projectName,
                          style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.location,
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Section 1: Service Details
            const Text(
              'Service Details',
              style: TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  _buildSummaryRow(
                    label: 'Civil Work',
                    value: '₹ ${subtotal.toInt()}',
                    valueStyle: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 14.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 10),
                    child: Divider(color: Color(0xFFF1F5F9)),
                  ),
                  _buildSummaryRow(
                    label: 'Estimated Time',
                    value: widget.quotation.timeline.isNotEmpty
                        ? widget.quotation.timeline
                        : '3-5 days',
                    valueStyle: const TextStyle(
                      color: Color(0xFF334155),
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Section 2: Payment Summary
            const Text(
              'Payment Summary',
              style: TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  _buildSummaryRow(
                    label: 'Service Amount',
                    value: '₹ ${subtotal.toInt()}',
                  ),
                  const SizedBox(height: 12),
                  _buildSummaryRow(
                    label: 'GST (18%)',
                    value: '₹ ${gst.toInt()}',
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Divider(color: Color(0xFFE2E8F0)),
                  ),
                  _buildSummaryRow(
                    label: 'Total Amount',
                    value: '₹ ${total.toInt()}',
                    isTotal: true,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),

      // Bottom Actions
      bottomSheet: Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(
            top: BorderSide(color: Color(0xFFF1F5F9)),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_currentStatus == QuoteDecision.pending) ...[
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _accept,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1864E8),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Accept Quotation',
                    style: TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: TextButton(
                  onPressed: _reject,
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFFEF4444),
                  ),
                  child: const Text(
                    'Reject',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ] else ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: _currentStatus == QuoteDecision.accepted
                      ? const Color(0xFFECFDF5)
                      : const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _currentStatus == QuoteDecision.accepted
                      ? '✓ Quotation Accepted'
                      : '✕ Quotation Rejected',
                  style: TextStyle(
                    color: _currentStatus == QuoteDecision.accepted
                        ? const Color(0xFF10B981)
                        : const Color(0xFFEF4444),
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow({
    required String label,
    required String value,
    TextStyle? valueStyle,
    bool isTotal = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isTotal ? const Color(0xFF0F172A) : const Color(0xFF64748B),
            fontSize: isTotal ? 15 : 14,
            fontWeight: isTotal ? FontWeight.w800 : FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: valueStyle ??
              TextStyle(
                color: isTotal ? const Color(0xFF1864E8) : const Color(0xFF0F172A),
                fontSize: isTotal ? 17 : 14,
                fontWeight: isTotal ? FontWeight.w900 : FontWeight.w600,
              ),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(QuoteDecision status) {
    Color bg;
    Color fg;
    String text;

    switch (status) {
      case QuoteDecision.accepted:
        bg = const Color(0xFFECFDF5);
        fg = const Color(0xFF10B981);
        text = 'Accepted';
        break;
      case QuoteDecision.rejected:
        bg = const Color(0xFFFEF2F2);
        fg = const Color(0xFFEF4444);
        text = 'Rejected';
        break;
      case QuoteDecision.pending:
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFFD97706);
        text = 'Pending';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: fg,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
