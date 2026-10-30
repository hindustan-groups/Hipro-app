import 'package:flutter/material.dart';

import '../../../core/widgets/chat_sheet.dart';
import '../../../main.dart';
import '../../payment/screens/payment_screen.dart';
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
    final subtotal = widget.quotation.subtotal > 0
        ? widget.quotation.subtotal
        : widget.quotation.grandTotal;
    final discount = widget.quotation.discount;
    final discountedSubtotal = (subtotal - discount) > 0
        ? (subtotal - discount)
        : subtotal;
    final gst = widget.quotation.taxGst > 0
        ? widget.quotation.taxGst
        : (discountedSubtotal * 0.18).round();
    final total = widget.quotation.grandTotal > 0
        ? widget.quotation.grandTotal.toDouble()
        : (discountedSubtotal + gst).toDouble();

    final double advAmount = widget.quotation.advanceAmount > 0
        ? widget.quotation.advanceAmount.toDouble()
        : (total * (widget.quotation.advancePercentage > 0 ? (widget.quotation.advancePercentage / 100) : 0.5));

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => PaymentScreen(
          title: widget.projectName,
          subtitle:
              'Quotation ${widget.quotation.quoteNumber.isNotEmpty ? widget.quotation.quoteNumber : "#Q-001"}',
          amount: total,
          advanceAmount: advAmount,
          advancePercentage: widget.quotation.advancePercentage,
          quotationId: widget.quotation.id,
          isAdvanceOnly: true,
        ),
      ),
    );
  }

  void _reject() async {
    final success = await appState.rejectQuotation(widget.quotation.id);
    if (!mounted) return;
    if (success) {
      setState(() => _currentStatus = QuoteDecision.rejected);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Quotation rejected.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to reject quotation. Please check your internet connection.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final subtotal = widget.quotation.subtotal > 0
        ? widget.quotation.subtotal
        : widget.quotation.grandTotal;
    final discount = widget.quotation.discount;
    final discountedSubtotal = (subtotal - discount) > 0
        ? (subtotal - discount)
        : subtotal;
    final gst = widget.quotation.taxGst > 0
        ? widget.quotation.taxGst
        : (discountedSubtotal * 0.18).round();
    final total = widget.quotation.grandTotal > 0
        ? widget.quotation.grandTotal
        : (discountedSubtotal + gst);
    final double advAmount = widget.quotation.advanceAmount > 0
        ? widget.quotation.advanceAmount.toDouble()
        : (total.toDouble() * (widget.quotation.advancePercentage > 0 ? (widget.quotation.advancePercentage / 100) : 0.5));
    final int advPct = widget.quotation.advancePercentage > 0
        ? widget.quotation.advancePercentage.round()
        : (total > 0 ? ((advAmount / total) * 100).round() : 50);

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
        actions: [
          IconButton(
            icon: const Icon(Icons.chat_outlined, color: Color(0xFF1864E8)),
            tooltip: 'Chat with Estimator',
            onPressed: () {
              ChatSheet.show(
                context,
                title: 'Quotation Discussion',
                subtitle: 'Estimation Team • Technical Consultation',
                contextType: 'QUOTATION',
                quoteNumber: widget.quotation.quoteNumber,
                amount: widget.quotation.grandTotal,
                contextTag: widget.projectName,
              );
            },
          ),
        ],
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
                    Text(
                      () {
                        final dt = widget.quotation.createdAt;
                        const m = [
                          'Jan',
                          'Feb',
                          'Mar',
                          'Apr',
                          'May',
                          'Jun',
                          'Jul',
                          'Aug',
                          'Sep',
                          'Oct',
                          'Nov',
                          'Dec',
                        ];
                        return '${dt.day} ${m[dt.month - 1]} ${dt.year}';
                      }(),
                      style: const TextStyle(
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
                      color: const Color(0xFFEFF6FF),
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

            // Section 1: Itemized Scope & Bill of Quantities (BOQ)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Itemized Scope & BOQ',
                  style: TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (widget.quotation.lineItems.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 3.5,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                    ),
                    child: Text(
                      '${widget.quotation.lineItems.length} Items',
                      style: const TextStyle(
                        color: Color(0xFF475569),
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  // Table Header
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    decoration: const BoxDecoration(
                      color: Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(16),
                      ),
                      border: Border(
                        bottom: BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                    ),
                    child: const Row(
                      children: [
                        SizedBox(
                          width: 24,
                          child: Text(
                            '#',
                            style: TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Text(
                            'ITEM DESCRIPTION & SCOPE',
                            style: TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ),
                        Text(
                          'AMOUNT (₹)',
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Line Items List
                  if (widget.quotation.lineItems.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        widget.projectName,
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 13,
                        ),
                      ),
                    )
                  else
                    ...widget.quotation.lineItems.asMap().entries.map((entry) {
                      final idx = entry.key + 1;
                      final item = entry.value;
                      final isLast = idx == widget.quotation.lineItems.length;

                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          border: isLast
                              ? null
                              : const Border(
                                  bottom: BorderSide(color: Color(0xFFF1F5F9)),
                                ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(
                              width: 24,
                              child: Container(
                                width: 18,
                                height: 18,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  '$idx',
                                  style: const TextStyle(
                                    color: Color(0xFF64748B),
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ),
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.item,
                                      style: const TextStyle(
                                        color: Color(0xFF0F172A),
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      '${item.qty} ${item.unit} × ₹${item.rate.toInt()}',
                                      style: const TextStyle(
                                        color: Color(0xFF64748B),
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            Text(
                              '₹ ${item.amount.toInt()}',
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Section 2: Material & Technical Cost Breakdown
            const Text(
              'Cost & Material Breakdown',
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
                  if (widget.quotation.materialCost > 0) ...[
                    _buildSummaryRow(
                      label: 'Material & Chemical Supplies',
                      value: '₹ ${widget.quotation.materialCost.toInt()}',
                    ),
                    const SizedBox(height: 10),
                  ],
                  if (widget.quotation.laborCost > 0) ...[
                    _buildSummaryRow(
                      label: 'Labor & Application Expertise',
                      value: '₹ ${widget.quotation.laborCost.toInt()}',
                    ),
                    const SizedBox(height: 10),
                  ],
                  _buildSummaryRow(
                    label: 'Base Scope Total',
                    value: '₹ ${subtotal.toInt()}',
                  ),
                  if (widget.quotation.discount > 0) ...[
                    const SizedBox(height: 10),
                    _buildSummaryRow(
                      label: 'Special Discount',
                      value: '- ₹ ${widget.quotation.discount.toInt()}',
                      valueStyle: const TextStyle(
                        color: Color(0xFFEA580C),
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  _buildSummaryRow(
                    label: 'GST (18%)',
                    value: '₹ ${gst.toInt()}',
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Divider(color: Color(0xFFE2E8F0)),
                  ),
                  _buildSummaryRow(
                    label: 'Grand Total Amount',
                    value: '₹ ${total.toInt()}',
                    isTotal: true,
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.bolt_rounded, size: 16, color: Color(0xFF1864E8)),
                                const SizedBox(width: 4),
                                Text(
                                  'Min. Advance to Start Work ($advPct%):',
                                  style: const TextStyle(
                                    color: Color(0xFF1E40AF),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'Balance payable upon project completion',
                              style: TextStyle(
                                color: Color(0xFF3B82F6),
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          '₹ ${advAmount.round()}',
                          style: const TextStyle(
                            color: Color(0xFF1864E8),
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Section 3: Execution Timeline & Terms
            const SizedBox(height: 24),
            const Text(
              'Timeline & Execution Terms',
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
                    label: 'Estimated Work Duration',
                    value: widget.quotation.timeline.isNotEmpty
                        ? widget.quotation.timeline
                        : '1-2 Working Days',
                    valueStyle: const TextStyle(
                      color: Color(0xFFD97706),
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 10),
                    child: Divider(color: Color(0xFFF1F5F9)),
                  ),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.shield_outlined,
                        size: 18,
                        color: Color(0xFF1864E8),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          widget.quotation.terms,
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 12.5,
                            height: 1.45,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),

      // Bottom Actions
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 12),
          decoration: BoxDecoration(
            color: Colors.white,
            border: const Border(top: BorderSide(color: Color(0xFFF1F5F9))),
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
                  height: 46,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      ChatSheet.show(
                        context,
                        title: 'Quotation Discussion',
                        subtitle: 'Estimation Team • Technical Consultation',
                        contextType: 'QUOTATION',
                        quoteNumber: widget.quotation.quoteNumber,
                        amount: widget.quotation.grandTotal,
                        contextTag: widget.projectName,
                      );
                    },
                    icon: const Icon(
                      Icons.chat_bubble_outline_rounded,
                      size: 16,
                    ),
                    label: const Text(
                      'Chat with Estimator / Ask Questions',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF1864E8),
                      side: const BorderSide(color: Color(0xFFBFDBFE)),
                      backgroundColor: const Color(0xFFEFF6FF),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
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
                    child: Text(
                      'Accept & Pay Advance (₹${advAmount.round()})',
                      style: const TextStyle(
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
                        ? const Color(0xFFFEF3C7)
                        : const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _currentStatus == QuoteDecision.accepted
                        ? '✓ Quotation Accepted'
                        : '✕ Quotation Rejected',
                    style: TextStyle(
                      color: _currentStatus == QuoteDecision.accepted
                          ? const Color(0xFF92400E)
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
          style:
              valueStyle ??
              TextStyle(
                color: isTotal
                    ? const Color(0xFF0F172A)
                    : const Color(0xFF0F172A),
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
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFF92400E);
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
        style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w700),
      ),
    );
  }
}
