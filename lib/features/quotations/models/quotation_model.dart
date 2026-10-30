enum QuoteDecision { pending, accepted, rejected }

num _toNum(dynamic val, [num defaultValue = 0]) {
  if (val == null) return defaultValue;
  if (val is num) return val;
  if(val is String){
    return num.tryParse(val) ?? defaultValue;
  }
  return defaultValue;
}

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
    final qty = _toNum(json['qty'], 1);
    final rate = _toNum(json['rate']);
    final amount = json['amount'] != null ? _toNum(json['amount']) : (qty * rate);

    return QuotationLineItem(
      item: json['item']?.toString() ?? json['description']?.toString() ?? 'Service Scope',
      qty: qty,
      unit: json['unit']?.toString() ?? 'Unit',
      rate: rate,
      amount: amount,
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
  final String requestNumber;
  final String title;
  final String location;
  final List<QuotationLineItem> lineItems;
  final num materialCost;
  final num laborCost;
  final num subtotal;
  final num discount;
  final num taxGst;
  final num grandTotal;
  final num advancePercentage;
  final num advanceAmount;
  final String timeline;
  final String terms;
  final QuoteDecision status;
  final DateTime createdAt;

  const QuotationModel({
    required this.id,
    required this.quoteNumber,
    required this.requestId,
    this.requestNumber = '',
    this.title = 'Repair & Waterproofing Quotation',
    this.location = 'Site Address',
    required this.lineItems,
    required this.materialCost,
    required this.laborCost,
    required this.subtotal,
    this.discount = 0,
    required this.taxGst,
    required this.grandTotal,
    this.advancePercentage = 50.0,
    this.advanceAmount = 0,
    required this.timeline,
    required this.terms,
    this.status = QuoteDecision.pending,
    required this.createdAt,
  });

  factory QuotationModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['lineItem'] ?? json['lineItems'];
    final reqObj = json['request'] is Map<String, dynamic>
        ? json['request']
        : null;

    final parsedRequestNumber = reqObj?['requestNumber']?.toString() ??
        json['requestNumber']?.toString() ??
        '';

    final parsedTitle =
        reqObj?['servicecode'] ??
        (rawItems is List && rawItems.isNotEmpty && rawItems[0]['item'] != null
            ? rawItems[0]['item'].toString()
            : 'Service Quotation');

    final parsedLoc =
        reqObj?['addressline'] ?? reqObj?['location'] ?? 'Bhilwara, Rajasthan';

    final total = _toNum(json['grandtotal'] ?? json['grandTotal'] ?? json['totalAmount']);
    final advPct = _toNum(json['advancePercentage'], 50.0);
    final advAmt = json['advanceAmount'] != null
        ? _toNum(json['advanceAmount'])
        : (total > 0 ? (total * (advPct / 100)).round() : 0);

    return QuotationModel(
      id: json['id'] ?? '',
      quoteNumber: json['quoteNumber'] ?? '',
      requestId: json['requestId'] ?? '',
      requestNumber: parsedRequestNumber,
      title: parsedTitle,
      location: parsedLoc,
      lineItems: (rawItems is List)
          ? rawItems
                .map(
                  (e) => QuotationLineItem.fromJson(
                    Map<String, dynamic>.from(e as Map),
                  ),
                )
                .toList()
          : [],
      materialCost: _toNum(json['materialCost']),
      laborCost: _toNum(json['laborCost']),
      subtotal: _toNum(json['subtotal']),
      discount: _toNum(json['discount']),
      taxGst: _toNum(json['taxGST']),
      grandTotal: total,
      advancePercentage: advPct >= 0 ? advPct : 50.0,
      advanceAmount: advAmt >= 0 ? advAmt : (total > 0 ? (total * (advPct / 100)).round() : 0),
      timeline: json['estimatedTimeline'] ?? json['timeline'] ?? '1-2 Days',
      terms:
          json['termsAndConditions'] ??
          json['terms'] ??
          'Standard service scope and payment terms apply.',
      status: (json['status'] == 'ACCEPTED' || json['status'] == 'PAID')
          ? QuoteDecision.accepted
          : json['status'] == 'REJECTED'
          ? QuoteDecision.rejected
          : QuoteDecision.pending,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }
}
