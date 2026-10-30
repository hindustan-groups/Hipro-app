import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:hipro_app/core/network/api_client.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../core/session/user_session.dart';
import '../../../main.dart';
import '../../auth/screens/login_screen.dart';
import '../../navigation/main_nav_screen.dart';
import '../models/service_model.dart';
import 'inspection_success_screen.dart';

class CreateInspectionScreen extends StatefulWidget {
  const CreateInspectionScreen({
    super.key,
    this.preselectedService,
    this.preselectedSubService,
  });
  final ServiceItem? preselectedService;
  final SubService? preselectedSubService;
  @override
  State<CreateInspectionScreen> createState() => _CreateInspectionScreenState();
}

class _CreateInspectionScreenState extends State<CreateInspectionScreen> {
  int _currentStep = 1;
  bool _isLoadingData = true;

  // ImageKit upload state
  static const int _maxPhotos = 6;
  final ImagePicker _picker = ImagePicker();
  final List<String> _uploadPhotoUrls = [];
  final List<String> _uploadVideoUrls = [];
  bool _isUploadingImage = false;
  bool _isUploadingVideo = false;
  String _uploadStatusText = 'Uploading...';

  // Dynamic Lists loaded from backend
  List<String> _categories = [];
  Map<String, List<String>> _subServices = {};
  Map<String, String> _categoryIcons = {};
  Map<String, String> _subServiceIcons = {};

  // Form Fields
  String? _selectedCategory;
  String? _selectedSubService;
  final TextEditingController _descriptionController = TextEditingController();
  String _propertyType = 'Residential Villa';
  final TextEditingController _areaController =
      TextEditingController(text: '1500');
  final TextEditingController _addressController =
      TextEditingController(text: 'Plot 42, Subhash Nagar, Bhilwara');
  final TextEditingController _cityController =
      TextEditingController(text: 'Bhilwara, Rajasthan');
  String _preferredTime = 'Morning (09:00 AM - 12:00 PM)';

  @override
  void initState() {
    super.initState();
    if (widget.preselectedService != null) {
      final sName = widget.preselectedService!.name.trim();
      _selectedCategory = sName;
      if (widget.preselectedService!.imageUrl.isNotEmpty) {
        _categoryIcons[sName] = widget.preselectedService!.imageUrl.trim();
      }
    }
    if (widget.preselectedSubService != null) {
      final subName = widget.preselectedSubService!.name.trim();
      _selectedSubService = subName;
      if (widget.preselectedSubService!.image != null &&
          widget.preselectedSubService!.image!.isNotEmpty) {
        _subServiceIcons[subName] = widget.preselectedSubService!.image!.trim();
      }
    }
    _loadBackendServices();
    _retrieveLostData();
  }

  Future<void> _retrieveLostData() async {
    try {
      final LostDataResponse response = await _picker.retrieveLostData();
      if (response.isEmpty) return;
      if (response.file != null) {
        final file = response.file!;
        if (response.type == RetrieveType.video) {
          await _uploadVideoFile(file);
        } else {
          await _uploadMultipleImageFiles([file]);
        }
      } else if (response.files != null && response.files!.isNotEmpty) {
        if (response.type == RetrieveType.video) {
          for (final file in response.files!) {
            await _uploadVideoFile(file);
          }
        } else {
          await _uploadMultipleImageFiles(response.files!);
        }
      }
      if (response.exception != null) {
        debugPrint('retrieveLostData exception: ${response.exception}');
      }
    } catch (e) {
      debugPrint('retrieveLostData error: $e');
    }
  }

  Future<void> _loadBackendServices() async {
    try {
      final response = await ApiClient().dio.get('/services');
      final dynamic list = response.data['services'] ?? response.data['data'] ?? response.data;
      if (list is List && list.isNotEmpty) {
        final Map<String, List<String>> tempSub = {};
        final List<String> tempCats = [];
        final Map<String, String> tempIcons = {};
        final Map<String, String> tempSubImages = {};

        for (var item in list) {
          final catName = ((item['name'] as String?) ?? 'General').trim();
          tempCats.add(catName);
          final iconUrl = (item['imageUrl'] ?? item['iconImage'] ?? item['icon'] ?? '').toString().trim();
          tempIcons[catName] = iconUrl;

          final rawSubs = (item['subServices'] as List<dynamic>?);
          final List<String> subList = [];
          if (rawSubs != null && rawSubs.isNotEmpty) {
            for (var s in rawSubs) {
              final getQuoteEnabled = s['getQuoteEnabled'] != false && s['isActive'] != false;
              if (!getQuoteEnabled) continue;
              final subTitle = (s['titleEn'] ?? s['name'] ?? 'General Inspection').toString().trim();
              subList.add(subTitle);
              final subImg = (s['image'] ?? s['imageUrl'] ?? iconUrl).toString().trim();
              if (subImg.isNotEmpty) {
                tempSubImages[subTitle] = subImg;
              }
            }
          } else {
            subList.add('General Inspection');
            if (iconUrl.isNotEmpty) {
              tempSubImages['General Inspection'] = iconUrl;
            }
          }

          tempSub[catName] = subList.isNotEmpty ? subList : ['General Inspection'];
        }

        if (widget.preselectedService != null && widget.preselectedService!.imageUrl.isNotEmpty) {
          tempIcons[widget.preselectedService!.name.trim()] = widget.preselectedService!.imageUrl.trim();
        }
        if (widget.preselectedSubService != null &&
            widget.preselectedSubService!.image != null &&
            widget.preselectedSubService!.image!.isNotEmpty) {
          tempSubImages[widget.preselectedSubService!.name.trim()] =
              widget.preselectedSubService!.image!.trim();
        }

        if (mounted) {
          setState(() {
            _categories = tempCats.toSet().toList();
            _subServices = tempSub;
            _categoryIcons = tempIcons;
            _subServiceIcons = tempSubImages;

            if (widget.preselectedService != null &&
                tempCats.contains(widget.preselectedService!.name.trim())) {
              _selectedCategory = widget.preselectedService!.name.trim();
            } else if (_selectedCategory == null || !_categories.contains(_selectedCategory)) {
              _selectedCategory = _categories.isNotEmpty ? _categories.first : null;
            }
            if (_selectedCategory != null) {
              final initialSubs = tempSub[_selectedCategory];
              if (widget.preselectedSubService != null &&
                  initialSubs != null &&
                  initialSubs.contains(widget.preselectedSubService!.name.trim())) {
                _selectedSubService = widget.preselectedSubService!.name.trim();
              } else {
                _selectedSubService = (initialSubs != null && initialSubs.isNotEmpty)
                    ? initialSubs.first
                    : 'General Inspection';
              }
            } else {
              _selectedSubService = null;
            }

            _isLoadingData = false;
          });
        }
      } else {
        //  _applyFallbackCategories();
        if (mounted) setState(() => _isLoadingData = false);
      }   
    } catch (e) {
      if (mounted) setState(() => _isLoadingData = false);
    }
  }

  Future<bool> _requestMediaPermissions({required bool isVideo, required ImageSource source}) async {
    if (source == ImageSource.camera) {
      try {
        final cameraStatus = await Permission.camera.request();
        if (cameraStatus.isPermanentlyDenied) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text('Camera permission is disabled. Please enable it in Settings.'),
                action: SnackBarAction(
                  label: 'Settings',
                  onPressed: () => openAppSettings(),
                ),
              ),
            );
          }
          return false;
        }

        if (!cameraStatus.isGranted) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text('Camera permission is required to capture photos.'),
                action: SnackBarAction(
                  label: 'Settings',
                  onPressed: () => openAppSettings(),
                ),
              ),
            );
          }
          return false;
        }

        if (isVideo) {
          final micStatus = await Permission.microphone.request();
          if (!micStatus.isGranted) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Microphone permission is required for video recording.'),
                  action: SnackBarAction(
                    label: 'Settings',
                    onPressed: () => openAppSettings(),
                  ),
                ),
              );
            }
            return false;
          }
        }
      } catch (e) {
        debugPrint('Media permission check error: $e');
        // Let image_picker attempt its native intent as fallback
      }
    }
    return true;
  }

  Future<bool> _uploadSingleImage(XFile file) async {
    try {
      final fileName = file.name.isNotEmpty 
          ? file.name 
          : 'inspection_${DateTime.now().millisecondsSinceEpoch}.jpg';

      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
        'folder': '/inspections',
      });

      final response = await ApiClient().dio.post(
        '/upload',
        data: formData,
        options: Options(
          sendTimeout: const Duration(minutes: 5),
          receiveTimeout: const Duration(minutes: 5),
        ),
      );

      if (response.statusCode == 200 && response.data != null && response.data['data'] != null) {
        final String? cloudUrl = response.data['data']['url'];
        if (cloudUrl != null && cloudUrl.isNotEmpty) {
          if (mounted) {
            setState(() {
              _uploadPhotoUrls.add(cloudUrl);
            });
          }
          return true;
        }
      }
      return false;
    } catch (e) {
      debugPrint('Image upload error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload Failed: $e')),
        );
      }
      return false;
    }
  }

  Future<void> _uploadMultipleImageFiles(List<XFile> files) async {
    if (files.isEmpty) return;
    setState(() {
      _isUploadingImage = true;
      _uploadStatusText = files.length > 1 ? 'Uploading 1 of ${files.length}...' : 'Uploading...';
    });

    int uploadedCount = 0;
    try {
      for (int i = 0; i < files.length; i++) {
        if (_uploadPhotoUrls.length >= _maxPhotos) break;
        if (files.length > 1 && mounted) {
          setState(() {
            _uploadStatusText = 'Uploading ${i + 1} of ${files.length}...';
          });
        }
        final success = await _uploadSingleImage(files[i]);
        if (success) uploadedCount++;
      }
      if (mounted && uploadedCount > 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              uploadedCount == 1
                  ? 'Photo uploaded successfully!'
                  : '$uploadedCount photos uploaded successfully!',
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploadingImage = false;
          _uploadStatusText = 'Uploading...';
        });
      }
    }
  }

  Future<void> _uploadVideoFile(XFile video) async {
    setState(() => _isUploadingVideo = true);
    try {
      final fileName = video.name.isNotEmpty
          ? video.name
          : 'video_${DateTime.now().millisecondsSinceEpoch}.mp4';

      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          video.path,
          filename: fileName,
        ),
        'folder': '/inspections/videos',
      });

      final response = await ApiClient().dio.post(
        '/upload',
        data: formData,
        options: Options(
          sendTimeout: const Duration(minutes: 5),
          receiveTimeout: const Duration(minutes: 5),
        ),
      );

      if (response.statusCode == 200 && response.data != null && response.data['data'] != null) {
        final String? videoUrl = response.data['data']['url'];
        if (videoUrl != null && videoUrl.isNotEmpty) {
          setState(() {
            _uploadVideoUrls.add(videoUrl);
          });

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Video uploaded successfully!')),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload Failed: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploadingVideo = false);
      }
    }
  }

  Future<void> _pickAndUploadImage({ImageSource source = ImageSource.gallery}) async {
    final remainingSlots = _maxPhotos - _uploadPhotoUrls.length;
    if (remainingSlots <= 0) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('You have already added the maximum of 6 photos.')),
        );
      }
      return;
    }

    try {
      final hasPermission = await _requestMediaPermissions(isVideo: false, source: source);
      if (!hasPermission) return;

      if (source == ImageSource.gallery) {
        final List<XFile> files = await _picker.pickMultiImage(
          limit: remainingSlots,
          maxWidth: 1920,
          maxHeight: 1920,
          imageQuality: 80,
        );

        if (files.isEmpty) return;

        final filesToUpload = files.take(remainingSlots).toList();
        if (files.length > remainingSlots && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Selected first $remainingSlots photo(s) to stay within the 6-photo limit.')),
          );
        }
        await _uploadMultipleImageFiles(filesToUpload);
      } else {
        final XFile? file = await _picker.pickImage(
          source: ImageSource.camera,
          maxWidth: 1920,
          maxHeight: 1920,
          imageQuality: 80,
          preferredCameraDevice: CameraDevice.rear,
        );
        if (file == null) return;
        await _uploadMultipleImageFiles([file]);
      }
    } catch (e) {
      debugPrint('Camera/Gallery pickImage error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Camera/Gallery error: $e')),
        );
      }
    }
  }

  Future<void> _recordAndUploadVideo({ImageSource source = ImageSource.camera}) async {
    try {
      final hasPermission = await _requestMediaPermissions(isVideo: true, source: source);
      if (!hasPermission) return;

      final XFile? video = await _picker.pickVideo(
        source: source,
        maxDuration: const Duration(seconds: 60),
        preferredCameraDevice: CameraDevice.rear,
      );
      if (video == null) return;
      await _uploadVideoFile(video);
    } catch (e) {
      debugPrint('Video record/pick error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Video recording error: $e')),
        );
      }
    }
  }

  void _showMediaSourceSheet({required bool isVideo}) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  isVideo
                      ? 'Add Video Evidence'
                      : 'Add Photo Evidence (${_uploadPhotoUrls.length}/$_maxPhotos)',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1864E8).withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isVideo ? Icons.videocam_rounded : Icons.camera_alt_rounded,
                      color: const Color(0xFF1864E8),
                    ),
                  ),
                  title: Text(isVideo ? 'Record Video (Camera)' : 'Take Photo (Camera)'),
                  subtitle: Text(isVideo
                      ? 'Up to 60 seconds rear camera'
                      : _uploadPhotoUrls.length >= _maxPhotos
                          ? 'Max $_maxPhotos photos already added'
                          : 'Capture single photo using camera'),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    if (isVideo) {
                      _recordAndUploadVideo(source: ImageSource.camera);
                    } else {
                      _pickAndUploadImage(source: ImageSource.camera);
                    }
                  },
                ),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1864E8).withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isVideo ? Icons.video_library_rounded : Icons.photo_library_rounded,
                      color: const Color(0xFF1864E8),
                    ),
                  ),
                  title: Text(isVideo
                      ? 'Choose Video from Gallery'
                      : 'Choose Photos from Gallery (Multi-select)'),
                  subtitle: Text(isVideo
                      ? 'Select existing file from device'
                      : 'Select multiple photos at once (up to ${_maxPhotos - _uploadPhotoUrls.length} more)'),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    if (isVideo) {
                      _recordAndUploadVideo(source: ImageSource.gallery);
                    } else {
                      _pickAndUploadImage(source: ImageSource.gallery);
                    }
                  },
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _areaController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  bool _isSubmitting = false;

  void _onNext() async {
    if (_currentStep < 4) {
      if (_currentStep == 3 && (_isUploadingImage || _isUploadingVideo)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please wait for photos/videos to finish uploading.')),
        );
        return;
      }
      setState(() => _currentStep++);
    } else {
      if (_isSubmitting) return;
      setState(() => _isSubmitting = true);

      try {
        final allMedia = [..._uploadPhotoUrls, ..._uploadVideoUrls];
        final sizeText = _areaController.text.trim().isNotEmpty
            ? '${_areaController.text.trim()} sq ft'
            : '1500 sq ft';
        final addressText = _addressController.text.trim().isNotEmpty
            ? _addressController.text.trim()
            : 'Plot 42, Subhash Nagar';
        final cityText = _cityController.text.trim().isNotEmpty
            ? _cityController.text.trim()
            : 'Bhilwara, Rajasthan';
        final fullAddress = '$addressText, $cityText';
Future<bool> showPhonePromptDialog(BuildContext context) async {
  final controller = TextEditingController();
  final formKey = GlobalKey<FormState>();
  bool isSaving = false;

  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) {
      return StatefulBuilder(
        builder: (context, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 24,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Mobile Number Required',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Technicians need your contact number to coordinate site inspection.',
                    style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: controller,
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    decoration: const InputDecoration(
                      prefixText: '+91 ',
                      hintText: '10-digit mobile number',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                    validator: (val) {
                      if (!RegExp(r'^[6-9]\d{9}$').hasMatch(val?.trim() ?? '')) {
                        return 'Enter a valid 10-digit mobile number';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 14),
                  ElevatedButton(
                    onPressed: isSaving ? null : () async {
                      if (!formKey.currentState!.validate()) return;
                      setModalState(() => isSaving = true);
                      final enteredPhone = controller.text.trim();
                      try {
                        final token = UserSession().token;
                        if (token != null && token.isNotEmpty) {
                          await ApiClient().dio.patch(
                            '/auth/phone',
                            data: {'phoneNumber': enteredPhone},
                            options: Options(headers: {'Authorization': 'Bearer $token'}),
                          );
                        }
                      } catch (e) {
                        debugPrint('Could not update phone on remote: $e');
                      }
                      await UserSession().setUser(phone: enteredPhone);
                      if (ctx.mounted) Navigator.pop(ctx, true);
                    },
                    child: isSaving
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('Save & Continue'),
                  ),
                ],
              ),
            ),
          );
        },
      );
    },
  );

  return result ?? false;
}


        if (UserSession().phone == null || UserSession().phone!.trim().isEmpty) {
          final phoneEntered = await showPhonePromptDialog(context);
          if (!phoneEntered) return;
        }
        final newReq = await appState.submitRequest(
          categoryId: 'cat_${(_selectedCategory ?? 'general').toLowerCase()}',
          categoryName: _selectedCategory ?? 'General Service',
          subServiceName: _selectedSubService ?? 'Site Inspection',
          serviceId: widget.preselectedService?.id,
          subServiceId: widget.preselectedSubService?.id,
          issueDescription: _descriptionController.text.isNotEmpty
              ? _descriptionController.text
              : 'Inspection required for ${_selectedSubService ?? 'service'}.',
          photos: allMedia,
          propertyType: _propertyType,
          propertySize: sizeText,
          address: fullAddress,
          location: cityText,
          preferredDate: DateTime.now().toIso8601String().split('T')[0],
          preferredTime: _preferredTime,
          customerName: UserSession().name,
          customerPhone: UserSession().phone,
        );
        if(newReq.requestNumber.trim().isEmpty){
            throw Exception('Failed to create request, No request number generated');
        }

        if (!mounted) return;
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => InspectionSuccessScreen(
              requestId: newReq.requestNumber,
            ),
          ),
        );
      } catch (e) {
        if (mounted) {
          final msg = e.toString().replaceFirst('Exception: ', '');
          final isAuthError = msg.toLowerCase().contains('login') ||
              msg.toLowerCase().contains('unauthorized') ||
              msg.toLowerCase().contains('session') ||
              msg.toLowerCase().contains('401');

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to submit request: $msg'),
              backgroundColor: const Color(0xFFEF4444),
              duration: const Duration(seconds: 5),
              action: isAuthError
                  ? SnackBarAction(
                      label: 'Sign In',
                      textColor: Colors.white,
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => const LoginScreen(),
                          ),
                        );
                      },
                    )
                  : null,
            ),
          );
        }
      } finally {
        if (mounted) {
          setState(() => _isSubmitting = false);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _currentStep == 1 && Navigator.of(context).canPop(),
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (_currentStep > 1) {
          setState(() => _currentStep--);
        } else if (Navigator.of(context).canPop()) {
          Navigator.of(context).pop();
        } else {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (context) => const MainNavScreen()),
            (route) => false,
          );
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
            color: const Color(0xFF0F172A),
            onPressed: () {
              if (_currentStep > 1) {
                setState(() => _currentStep--);
              } else if (Navigator.of(context).canPop()) {
                Navigator.of(context).pop();
              } else {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (context) => const MainNavScreen()),
                  (route) => false,
                );
              }
            },
          ),
        title: const Text(
          'Create Inspection',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: false,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Top Step Progress Indicator
            _buildStepper(),

            const Divider(color: Color(0xFFF1F5F9), height: 1),

            // Form Content per Step
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 20,
                ),
                child: _buildCurrentStepView(),
              ),
            ),

            // Bottom Action Bar
            Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(
                  top: BorderSide(color: Color(0xFFF1F5F9)),
                ),
              ),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: (_isLoadingData || _isSubmitting) ? null : _onNext,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1864E8),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          _currentStep == 4 ? 'Submit Request' : 'Next',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

  Widget _buildStepper() {
    final steps = ['Service', 'Details', 'Photos', 'Location'];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          for (int i = 0; i < steps.length; i++) ...[
            Expanded(
              flex: 3,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: (i + 1) <= _currentStep
                          ? const Color(0xFF1864E8)
                          : const Color(0xFFF1F5F9),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '',
                        style: TextStyle(
                          color: (i + 1) <= _currentStep
                              ? Colors.white
                              : const Color(0xFF94A3B8),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    steps[i],
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: (i + 1) == _currentStep
                          ? const Color(0xFF0F172A)
                          : const Color(0xFF94A3B8),
                      fontSize: 11,
                      fontWeight: (i + 1) == _currentStep
                          ? FontWeight.w700
                          : FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            if (i < steps.length - 1)
              Expanded(
                flex: 2,
                child: Container(
                  height: 2,
                  margin: const EdgeInsets.only(bottom: 18),
                  color: (i + 1) < _currentStep
                      ? const Color(0xFF1864E8)
                      : const Color(0xFFE2E8F0),
                ),
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildCurrentStepView() {
    switch (_currentStep) {
      case 1:
        return _buildStep1Service();
      case 2:
        return _buildStep2Details();
      case 3:
        return _buildStep3Photos();
      case 4:
        return _buildStep4Location();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildInitialsAvatar(String text, double size) {
    final letter = text.trim().isNotEmpty ? text.trim()[0].toUpperCase() : 'S';
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFEBF2FE), Color(0xFFDBEAFE)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Text(
        letter,
        style: TextStyle(
          color: const Color(0xFF1864E8),
          fontSize: size * 0.44,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  Widget _buildProfessionalDropdown({
    required String label,
    required String? value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
    IconData? prefixIcon,
    Map<String, String>? itemIcons,
    String? fallbackImageUrl,
  }) {
    final effectiveValue = items.contains(value)
        ? value
        : (items.isNotEmpty ? items.first : null);
    final bool isServiceSelector = itemIcons != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF334155),
            fontSize: 14.5,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.1,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          height: 62,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F172A).withValues(alpha: 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: effectiveValue,
              dropdownColor: Colors.white,
              borderRadius: BorderRadius.circular(16),
              elevation: 8,
              menuMaxHeight: 350,
              icon: Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: Color(0xFF475569),
                  size: 22,
                ),
              ),
              selectedItemBuilder: (BuildContext context) {
                return items.map((String item) {
                  final rawUrl = itemIcons?[item] ?? itemIcons?[item.trim()] ?? fallbackImageUrl;
                  final hasImage = isServiceSelector && rawUrl != null && rawUrl.isNotEmpty && rawUrl.startsWith('http');

                  return Row(
                    children: [
                      if (isServiceSelector)
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: hasImage
                                ? CachedNetworkImage(
                                    imageUrl: rawUrl,
                                    width: 36,
                                    height: 36,
                                    fit: BoxFit.cover,
                                    filterQuality: FilterQuality.high,
                                    fadeInDuration: const Duration(milliseconds: 100),
                                    fadeOutDuration: const Duration(milliseconds: 100),
                                    placeholder: (_, _) => Shimmer.fromColors(
                                      baseColor: const Color(0xFFE2E8F0),
                                      highlightColor: const Color(0xFFF8FAFC),
                                      child: Container(
                                        width: 36,
                                        height: 36,
                                        color: Colors.white,
                                      ),
                                    ),
                                    errorWidget: (_, _, _) => _buildInitialsAvatar(item, 36),
                                  )
                                : _buildInitialsAvatar(item, 36),
                          ),
                        )
                      else
                        Icon(
                          prefixIcon ?? Icons.category_rounded,
                          color: const Color(0xFF1864E8),
                          size: 22,
                        ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          item,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 15.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  );
                }).toList();
              },
              items: items.map((item) {
                final isSelected = item == effectiveValue;
                final rawUrl = itemIcons?[item] ?? itemIcons?[item.trim()] ?? fallbackImageUrl;
                final hasImage = isServiceSelector && rawUrl != null && rawUrl.isNotEmpty && rawUrl.startsWith('http');

                return DropdownMenuItem<String>(
                  value: item,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        if (isServiceSelector)
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(7),
                              border: Border.all(
                                color: isSelected
                                    ? const Color(0xFF1864E8).withValues(alpha: 0.3)
                                    : const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(7),
                              child: hasImage
                                  ? CachedNetworkImage(
                                      imageUrl: rawUrl,
                                      width: 32,
                                      height: 32,
                                      fit: BoxFit.cover,
                                      filterQuality: FilterQuality.high,
                                      fadeInDuration: const Duration(milliseconds: 100),
                                      fadeOutDuration: const Duration(milliseconds: 100),
                                      placeholder: (_, _) => Shimmer.fromColors(
                                        baseColor: const Color(0xFFE2E8F0),
                                        highlightColor: const Color(0xFFF8FAFC),
                                        child: Container(
                                          width: 32,
                                          height: 32,
                                          color: Colors.white,
                                        ),
                                      ),
                                      errorWidget: (_, _, _) => _buildInitialsAvatar(item, 32),
                                    )
                                  : _buildInitialsAvatar(item, 32),
                            ),
                          )
                        else
                          Icon(
                            prefixIcon ?? Icons.category_rounded,
                            color: isSelected
                                ? const Color(0xFF1864E8)
                                : const Color(0xFF94A3B8),
                            size: 18,
                          ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            item,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: isSelected
                                  ? const Color(0xFF1864E8)
                                  : const Color(0xFF1E293B),
                              fontSize: 13.5,
                              fontWeight: isSelected
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                            ),
                          ),
                        ),
                        if (isSelected)
                          const Icon(
                            Icons.check_circle_rounded,
                            color: Color(0xFF1864E8),
                            size: 18,
                          ),
                      ],
                    ),
                  ),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStep1Service() {
    if (_isLoadingData) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 60),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_categories.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 60),
          child: Text(
            'No services available. Check your connection.',
            style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
          ),
        ),
      );
    }

    final rawsub = (_selectedCategory != null ? _subServices[_selectedCategory] : null) ?? [];
    final List<String> subList  = rawsub.isNotEmpty ? rawsub :['General Inspection'] ;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildProfessionalDropdown(
          label: 'Select Service Category',
          value: _selectedCategory,
          items: _categories,
          itemIcons: _categoryIcons,
          prefixIcon: Icons.category_rounded,
          onChanged: (val) {
            if (val != null) {
              setState(() {
                _selectedCategory = val;
                final availablesubs = _subServices[val];
                _selectedSubService = (availablesubs != null && availablesubs.isNotEmpty)
                    ? availablesubs.first
                    : 'General Inspection';
              });
            }
          },
        ),

        const SizedBox(height: 20),

        _buildProfessionalDropdown(
          label: 'Select Sub Service',
          value: subList.contains(_selectedSubService)
              ? _selectedSubService
              : subList.first,
          items: subList,
          itemIcons: _subServiceIcons,
          fallbackImageUrl: _selectedCategory != null ? _categoryIcons[_selectedCategory] : null,
          prefixIcon: Icons.handyman_rounded,
          onChanged: (val) {
            if (val != null) {
              setState(() => _selectedSubService = val);
            }
          },
        ),

        const SizedBox(height: 20),

        const Text(
          'Description',
          style: TextStyle(
            color: Color(0xFF334155),
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
          ),
          child: TextField(
            controller: _descriptionController,
            maxLines: 8,
            minLines: 6,
            maxLength: 500,
            style: const TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 15.5,
              fontWeight: FontWeight.w500,
              height: 1.5,
            ),
            decoration: const InputDecoration(
              hintText: 'Describe the issue or work required in detail...',
              hintStyle: TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 14.5,
              ),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              contentPadding: EdgeInsets.all(18),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStep2Details() {
    final types = ['Residential Villa', 'Commercial Building', 'Apartment', 'Industrial Plot'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildProfessionalDropdown(
          label: 'Property Type',
          value: _propertyType,
          items: types,
          prefixIcon: Icons.apartment_rounded,
          onChanged: (val) {
            if (val != null) setState(() => _propertyType = val);
          },
        ),
        const SizedBox(height: 20),

        const Text(
          'Estimated Area (sq.ft)',
          style: TextStyle(
            color: Color(0xFF334155),
            fontSize: 13.5,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: TextField(
            controller: _areaController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              hintText: 'e.g. 1500',
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStep3Photos() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Upload Photos & Video / Site Evidence',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Add clear photos or short video clips of the damage, seepage, or work site.',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
        ),
        const SizedBox(height: 20),

        // Tappable Upload Cards (Photos and Video with Video Icon)
        Row(
          children: [
            Expanded(
              child: _buildUploadCard(
                icon: Icons.add_photo_alternate_outlined,
                title: 'Upload Photos (${_uploadPhotoUrls.length}/$_maxPhotos)',
                subtitle: _uploadPhotoUrls.length >= _maxPhotos
                    ? 'Max $_maxPhotos photos added'
                    : 'Select up to ${_maxPhotos - _uploadPhotoUrls.length} more',
                isLoading: _isUploadingImage,
                loadingText: _uploadStatusText,
                onTap: _uploadPhotoUrls.length >= _maxPhotos
                    ? () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Maximum 6 photos already added. Delete some to add new ones.'),
                          ),
                        );
                      }
                    : () => _showMediaSourceSheet(isVideo: false),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: _buildUploadCard(
                icon: Icons.videocam_outlined,
                title: 'Upload Video',
                subtitle: 'MP4 up to 60s',
                isLoading: _isUploadingVideo,
                loadingText: 'Uploading...',
                onTap: () => _showMediaSourceSheet(isVideo: true),
              ),
            ),
          ],
        ),

        // Uploaded Images Preview Grid
        if (_uploadPhotoUrls.isNotEmpty) ...[
          const SizedBox(height: 20),
          Text(
            'Uploaded Photos (${_uploadPhotoUrls.length}/$_maxPhotos):',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFF334155),
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _uploadPhotoUrls.map((url) {
              return Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      url,
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                    ),
                  ),
                  Positioned(
                    top: 2,
                    right: 2,
                    child: GestureDetector(
                      onTap: () {
                        setState(() => _uploadPhotoUrls.remove(url));
                      },
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                          color: Colors.black54,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close,
                          size: 14,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ],

        // Uploaded Videos Preview Grid
        if (_uploadVideoUrls.isNotEmpty) ...[
          const SizedBox(height: 20),
          Text(
            'Uploaded Videos (${_uploadVideoUrls.length}):',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFF334155),
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _uploadVideoUrls.asMap().entries.map((entry) {
              final index = entry.key + 1;
              final url = entry.value;
              return Stack(
                children: [
                  Container(
                    width: 90,
                    height: 80,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.play_circle_fill_rounded,
                          color: Colors.white,
                          size: 30,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Video $index',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Positioned(
                    top: 2,
                    right: 2,
                    child: GestureDetector(
                      onTap: () {
                        setState(() => _uploadVideoUrls.remove(url));
                      },
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                          color: Colors.black54,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close,
                          size: 14,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildUploadCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool isLoading,
    required String loadingText,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: (_isUploadingImage || _isUploadingVideo) ? null : onTap,
      child: Container(
        height: 135,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: const Color(0xFF1864E8).withValues(alpha: 0.35),
            width: 1.5,
          ),
        ),
        child: Center(
          child: isLoading
              ? Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2.5),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      loadingText,
                      style: const TextStyle(
                        color: Color(0xFF1864E8),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                )
              : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1864E8).withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        icon,
                        color: const Color(0xFF1864E8),
                        size: 28,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      title,
                      style: const TextStyle(
                        color: Color(0xFF0F172A),
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 10.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildStep4Location() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Site Address',
          style: TextStyle(
            color: Color(0xFF334155),
            fontSize: 13.5,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: TextField(
            controller: _addressController,
            decoration: const InputDecoration(
              hintText: 'Plot/Street address',
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Text(
          'City / State',
          style: TextStyle(
            color: Color(0xFF334155),
            fontSize: 13.5,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: TextField(
            controller: _cityController,
            decoration: const InputDecoration(
              hintText: 'City, State, Pincode',
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
          ),
        ),
        const SizedBox(height: 20),
        _buildProfessionalDropdown(
          label: 'Preferred Slot',
          value: _preferredTime,
          items: const [
            'Morning (09:00 AM - 12:00 PM)',
            'Afternoon (01:00 PM - 04:00 PM)',
            'Evening (04:00 PM - 07:00 PM)',
          ],
          prefixIcon: Icons.access_time_rounded,
          onChanged: (val) {
            if (val != null) setState(() => _preferredTime = val);
          },
        ),
      ],
    );
  }
}
