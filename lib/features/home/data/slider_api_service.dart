import '../../../core/network/api_client.dart';
import '../models/banner_slide.dart';

class SliderApiService {
  Future<List<BannerSlide>> fetchSliders() async {
    try {
      final response = await ApiClient().dio.get('/slides');
      if (response.data != null) {
        final list = response.data['data'] ?? response.data['slides'] ?? response.data;
        if (list is List && list.isNotEmpty) {
          return list
              .map((e) => BannerSlide.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList();
        }
      }
      return [];
    } catch (_) {
      return [];
    }
  }
}
