import '../../../core/network/api_client.dart';
import '../../../core/session/user_session.dart';
import '../models/quotation_model.dart';

class QuotationApiService {
  final ApiClient apiClient;

  QuotationApiService(this.apiClient);

  Future<List<QuotationModel>> fetchQuotations() async {
    try {
      final session = UserSession();
      final Map<String, dynamic> queryParams = {};
      final phone = session.phone?.trim();
      if (phone != null && phone.isNotEmpty) {
        queryParams['phone'] = phone;
      }
      final response = await apiClient.dio.get(
        '/quotations',
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );
      if (response.statusCode == 200 && response.data != null) {
        final List list = response.data['data'] ?? response.data;
        return list.map((e) => QuotationModel.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> acceptQuotation(String quotationId) async {
    try {
      final response = await apiClient.dio.post(
        '/quotations/$quotationId/decision',
        data: {'decision': 'ACCEPTED'},
      );
      return response.statusCode == 200;
    } catch (_) {
      try {
        final res2 = await apiClient.dio.post('/quotations/$quotationId/accept');
        return res2.statusCode == 200;
      } catch (e) {
        rethrow;
      }
    }
  }

  Future<bool> rejectQuotation(String quotationId) async {
    try {
      final response = await apiClient.dio.post(
        '/quotations/$quotationId/decision',
        data: {'decision': 'REJECTED'},
      );
      return response.statusCode == 200;
    } catch (_) {
      try {
        final res2 = await apiClient.dio.post('/quotations/$quotationId/reject');
        return res2.statusCode == 200;
      } catch (e) {
        rethrow;
      }
    }
  }
}
