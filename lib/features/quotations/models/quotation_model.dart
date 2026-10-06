enum QuoteDecision { pending, accepted, rejected }

class QuotationLineItem {
  final String item;
  final num qty;
  final String unit;
  final num rate;
  final num amount;

  const QuotationLineItem({
    required this.item,
    required this.qty,
    required this.unit,
    required this.rate,
    required this.amount,
  });

  factory QuotationLineItem.fromJson(Map<String, dynamic> json) {
    return QuotationLineItem(
      item: json['item'] ?? '',
      qty: json['qty'] ?? 0,
      unit: json['unit'] ?? 'unit',
      rate: json['rate'] ?? 0,
      amount: json['amount'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'item': item,
      'qty': qty,
      'unit': unit,
      'rate': rate,
      'amount': amount,
    };
  }
}

class QuotationModel {
  final String id;
  final String quoteNumber;
  final String requestId;
  final List<QuotationLineItem> lineItems;
  final num materialCost;
  final num laborCost;
  final num subtotal;
  final num taxGst;
  final num grandTotal;
  final String timeline;
  final String terms;
  final QuoteDecision status;
  final DateTime createdAt;

  const QuotationModel({
    required this.id,
    required this.quoteNumber,
    required this.requestId,
    required this.lineItems,
    required this.materialCost,
    required this.laborCost,
    required this.subtotal,
    required this.taxGst,
    required this.grandTotal,
    required this.timeline,
    required this.terms,
    this.status = QuoteDecision.pending,
    required this.createdAt,
  });

  factory QuotationModel.fromJson(Map<String, dynamic> json) {
    return QuotationModel(
      id: json['id'] ?? '',
      quoteNumber: json['quoteNumber'] ?? '',
      requestId: json['requestId'] ?? '',
      lineItems:
          (json['lineItems'] as List<dynamic>?)
              ?.map(
                (e) => QuotationLineItem.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          [],
      materialCost: json['materialCost'] ?? 0,
      laborCost: json['laborCost'] ?? 0,
      subtotal: json['subtotal'] ?? 0,
      taxGst: json['taxGst'] ?? 0,
      grandTotal: json['grandTotal'] ?? json['totalAmount'] ?? 0,
      timeline: json['timeline'] ?? '1-2 Days',
      terms:
          json['terms'] ?? 'Standard digital warranty and payment terms apply.',
      status: json['status'] == 'ACCEPTED'
          ? QuoteDecision.accepted
          : json['status'] == 'REJECTED'
          ? QuoteDecision.rejected
          : QuoteDecision.pending,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }
}
