import 'package:flutter/material.dart';

import '../../features/inspections/models/request_model.dart';
import '../../features/quotations/models/quotation_model.dart';
import '../../features/services/data/mock_services.dart';
import '../../features/services/models/service_model.dart';

class AppState extends ChangeNotifier {
  final List<ServiceCategory> categories = mockServiceCategories;
  final List<ServiceRequestModel> _requests = [];
  final List<QuotationModel> _quotations = [];

  List<ServiceRequestModel> get requests => List.unmodifiable(_requests);
  List<QuotationModel> get quotations => List.unmodifiable(_quotations);

  AppState() {
    _seedInitialData();
  }

  void _seedInitialData() {
    // Seed an initial demo request & quotation
    final demoReq = ServiceRequestModel(
      id: 'req_101',
      requestNumber: 'REQ-2026-4821',
      categoryId: 'cat_waterproof',
      categoryName: 'Waterproofing & Seepage',
      subServiceName: 'Stop Roof & Terrace Water Leakage',
      issueDescription:
          'Heavy water seepage into master bedroom ceiling during monsoon.',
      photos: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      ],
      propertyType: 'House / Villa',
      address: 'Plot 42, Subhash Nagar, Bhilwara',
      status: RequestStatus.quoted,
      createdAt: DateTime.now().subtract(const Duration(hours: 4)),
    );
    _requests.add(demoReq);

    final demoQuote = QuotationModel(
      id: 'qte_501',
      quoteNumber: 'QTE-2026-8921',
      requestId: 'req_101',
      lineItems: const [
        QuotationLineItem(
          item: 'Polymer Chemical 3-Coat Waterproof Membrane',
          qty: 180,
          unit: 'sq.ft',
          rate: 45,
          amount: 8100,
        ),
        QuotationLineItem(
          item: 'PU Crack Injection & Micro-Grout Sealing',
          qty: 1,
          unit: 'job',
          rate: 1500,
          amount: 1500,
        ),
        QuotationLineItem(
          item: 'Skilled Technician Labor & Surface Prep',
          qty: 2,
          unit: 'days',
          rate: 1200,
          amount: 2400,
        ),
      ],
      materialCost: 9600,
      laborCost: 2400,
      subtotal: 12000,
      taxGst: 2160,
      grandTotal: 14160,
      timeline: '1-2 Working Days',
      terms: '50% Advance on acceptance, 50% upon final ponding test verification.',
      status: QuoteDecision.pending,
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
    );
    _quotations.add(demoQuote);
  }

  // Add new damage inspection request
  void submitRequest({
    required String categoryId,
    required String categoryName,
    required String subServiceName,
    required String issueDescription,
    required List<String> photos,
    required String propertyType,
    required String address,
  }) {
    final newReq = ServiceRequestModel(
      id: 'req_${DateTime.now().millisecondsSinceEpoch}',
      requestNumber: 'REQ-2026-${(1000 + _requests.length * 7)}',
      categoryId: categoryId,
      categoryName: categoryName,
      subServiceName: subServiceName,
      issueDescription: issueDescription,
      photos: photos,
      propertyType: propertyType,
      address: address,
      status: RequestStatus.estimating,
      createdAt: DateTime.now(),
    );
    _requests.insert(0, newReq);
    notifyListeners();
  }

  // Accept Quotation & mark request as PAID
  void acceptQuotation(String quoteId) {
    final index = _quotations.indexWhere((q) => q.id == quoteId);
    if (index != -1) {
      final old = _quotations[index];
      _quotations[index] = QuotationModel(
        id: old.id,
        quoteNumber: old.quoteNumber,
        requestId: old.requestId,
        lineItems: old.lineItems,
        materialCost: old.materialCost,
        laborCost: old.laborCost,
        subtotal: old.subtotal,
        taxGst: old.taxGst,
        grandTotal: old.grandTotal,
        timeline: old.timeline,
        terms: old.terms,
        status: QuoteDecision.accepted,
        createdAt: old.createdAt,
      );

      // Update corresponding request to PAID
      final reqIdx = _requests.indexWhere((r) => r.id == old.requestId);
      if (reqIdx != -1) {
        final rOld = _requests[reqIdx];
        _requests[reqIdx] = ServiceRequestModel(
          id: rOld.id,
          requestNumber: rOld.requestNumber,
          categoryId: rOld.categoryId,
          categoryName: rOld.categoryName,
          subServiceName: rOld.subServiceName,
          issueDescription: rOld.issueDescription,
          photos: rOld.photos,
          propertyType: rOld.propertyType,
          address: rOld.address,
          status: RequestStatus.paid,
          createdAt: rOld.createdAt,
        );
      }
      notifyListeners();
    }
  }
}
