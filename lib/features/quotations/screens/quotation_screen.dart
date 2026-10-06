import 'package:flutter/material.dart';

import '../models/quotation_model.dart';
import 'quotation_details_screen.dart';

class QuotationDisplayItem {
  final String id;
  final String quoteNumber;
  final String title;
  final String location;
  final double amount;
  final String date;
  final QuoteDecision status;

  const QuotationDisplayItem({
    required this.id,
    required this.quoteNumber,
    required this.title,
    required this.location,
    required this.amount,
    required this.date,
    required this.status,
  });
}

class QuotationScreen extends StatefulWidget {
  const QuotationScreen({super.key});

  @override
  State<QuotationScreen> createState() => _QuotationScreenState();
}

class _QuotationScreenState extends State<QuotationScreen> {
  String _selectedFilter = 'All';

  final List<QuotationDisplayItem> _quotations = [
    const QuotationDisplayItem(
      id: 'q1',
      quoteNumber: '#Q-001',
      title: 'Civil Work - Residential Villa',
      location: 'Bhilwara, Rajasthan',
      amount: 45000,
      date: '12 Apr 2025',
      status: QuoteDecision.pending,
    ),
    const QuotationDisplayItem(
      id: 'q2',
      quoteNumber: '#Q-002',
      title: 'Plumbing Work',
      location: 'Jaipur, Rajasthan',
      amount: 18500,
      date: '10 Apr 2025',
      status: QuoteDecision.accepted,
    ),
    const QuotationDisplayItem(
      id: 'q3',
      quoteNumber: '#Q-003',
      title: 'Electrical Work',
      location: 'Udaipur, Rajasthan',
      amount: 22000,
      date: '08 Apr 2025',
      status: QuoteDecision.pending,
    ),
    const QuotationDisplayItem(
      id: 'q4',
      quoteNumber: '#Q-004',
      title: 'Interior Work',
      location: 'Kota, Rajasthan',
      amount: 75000,
      date: '02 Apr 2025',
      status: QuoteDecision.rejected,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final filtered = _quotations.where((item) {
      if (_selectedFilter == 'All') return true;
      if (_selectedFilter == 'Pending') {
        return item.status == QuoteDecision.pending;
      }
      if (_selectedFilter == 'Accepted') {
        return item.status == QuoteDecision.accepted;
      }
      if (_selectedFilter == 'Rejected') {
        return item.status == QuoteDecision.rejected;
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text(
          'Quotations',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
        ),
        centerTitle: false,
      ),
      body: Column(
        children: [
          // Filter Tabs
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
            child: Row(
              children: ['All', 'Pending', 'Accepted', 'Rejected'].map((filter) {
                final isSelected = filter == _selectedFilter;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedFilter = filter),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isSelected
                            ? const Color(0xFF1864E8)
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        filter,
                        style: TextStyle(
                          color: isSelected
                              ? Colors.white
                              : const Color(0xFF64748B),
                          fontSize: 12.5,
                          fontWeight: isSelected
                              ? FontWeight.w700
                              : FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          // Quotations List
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
              itemCount: filtered.length,
              separatorBuilder: (_, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = filtered[index];
                return GestureDetector(
                  onTap: () {
                    final quoteModel = QuotationModel(
                      id: item.id,
                      quoteNumber: item.quoteNumber,
                      requestId: 'req_demo',
                      lineItems: [
                        QuotationLineItem(
                          item: item.title,
                          qty: 1,
                          unit: 'job',
                          rate: item.amount,
                          amount: item.amount,
                        ),
                      ],
                      materialCost: item.amount * 0.7,
                      laborCost: item.amount * 0.3,
                      subtotal: item.amount,
                      taxGst: item.amount * 0.18,
                      grandTotal: item.amount * 1.18,
                      timeline: '3-5 days',
                      terms: 'Standard terms',
                      status: item.status,
                      createdAt: DateTime.now(),
                    );

                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => QuotationDetailsScreen(
                          quotation: quoteModel,
                          projectName: item.title,
                          location: item.location,
                        ),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color:
                              const Color(0xFF0F172A).withValues(alpha: 0.02),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Row 1: Quote # and Status Badge
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              item.quoteNumber,
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 14.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            _buildBadge(item.status),
                          ],
                        ),
                        const SizedBox(height: 6),

                        // Title
                        Text(
                          item.title,
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 13,
                          ),
                        ),

                        const SizedBox(height: 12),

                        // Row 2: Price and Date
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '₹ ${item.amount.toInt()}',
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            Text(
                              item.date,
                              style: const TextStyle(
                                color: Color(0xFF94A3B8),
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadge(QuoteDecision status) {
    Color bg;
    Color fg;
    String label;

    switch (status) {
      case QuoteDecision.accepted:
        bg = const Color(0xFFECFDF5);
        fg = const Color(0xFF10B981);
        label = 'Accepted';
        break;
      case QuoteDecision.rejected:
        bg = const Color(0xFFFEF2F2);
        fg = const Color(0xFFEF4444);
        label = 'Rejected';
        break;
      case QuoteDecision.pending:
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFFD97706);
        label = 'Pending';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
