import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../config/theme/app_colors.dart';
import '../../../main.dart';
import '../models/service_model.dart';

class CreateInspectionScreen extends StatefulWidget {
  const CreateInspectionScreen({
    super.key,
    this.preselectedCategory,
    this.preselectedSubService,
  });

  final ServiceCategory? preselectedCategory;
  final SubService? preselectedSubService;

  @override
  State<CreateInspectionScreen> createState() => _CreateInspectionScreenState();
}

class _CreateInspectionScreenState extends State<CreateInspectionScreen> {
  static const int _maxImages = 5;

  final _formKey = GlobalKey<FormState>();
  final _picker = ImagePicker();
  final List<XFile> _selectedImages = [];
  final Set<String> _selectedSymptoms = {};

  late final TextEditingController _descriptionController;
  late final TextEditingController _addressController;
  late ServiceCategory _selectedCategory;
  SubService? _selectedSubService;
  String _propertyType = 'House / Villa';
  bool _isSubmitting = false;

  static const List<({String label, IconData icon})> _propertyTypes = [
    (label: 'House / Villa', icon: Icons.home_rounded),
    (label: 'Apartment / Flat', icon: Icons.apartment_rounded),
    (label: 'Commercial Office', icon: Icons.business_rounded),
    (label: 'Factory / Warehouse', icon: Icons.factory_rounded),
  ];

  @override
  void initState() {
    super.initState();
    _selectedCategory =
        widget.preselectedCategory ??
        (appState.categories.isNotEmpty
            ? appState.categories.first
            : _fallbackCategory());
    _selectedSubService =
        widget.preselectedSubService ??
        (_selectedCategory.subcategories.isNotEmpty
            ? _selectedCategory.subcategories.first
            : null);
    _descriptionController = TextEditingController(
      text: _selectedSubService?.defaultNotes ?? '',
    );
    _addressController = TextEditingController();
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  ServiceCategory _fallbackCategory() {
    return const ServiceCategory(
      id: 'cat_general',
      title: 'General Inspection',
      shortTitle: 'General',
      subtitle: 'Damage inspection',
      icon: Icons.build_rounded,
      color: AppColors.primary,
      bg: AppColors.surface,
      subcategories: [],
    );
  }

  void _changeCategory(ServiceCategory category) {
    final firstSubService = category.subcategories.isEmpty
        ? null
        : category.subcategories.first;
    setState(() {
      _selectedCategory = category;
      _selectedSubService = firstSubService;
      _selectedSymptoms.clear();
      _descriptionController.text = firstSubService?.defaultNotes ?? '';
    });
  }

  void _changeSubService(SubService? subService) {
    setState(() {
      _selectedSubService = subService;
      _selectedSymptoms.clear();
      _descriptionController.text = subService?.defaultNotes ?? '';
    });
  }

  Future<void> _pickImage(ImageSource source) async {
    if (_selectedImages.length >= _maxImages) {
      _showMessage('You can upload up to $_maxImages images.');
      return;
    }

    try {
      final image = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1600,
      );
      if (image != null && mounted) {
        setState(() => _selectedImages.add(image));
      }
    } catch (_) {
      _showMessage('Unable to access the selected image.');
    }
  }

  Future<void> _pickMultipleImages() async {
    final remaining = _maxImages - _selectedImages.length;
    if (remaining <= 0) {
      _showMessage('You can upload up to $_maxImages images.');
      return;
    }

    try {
      final images = await _picker.pickMultiImage(
        imageQuality: 85,
        maxWidth: 1600,
        limit: remaining,
      );
      if (images.isNotEmpty && mounted) {
        setState(() => _selectedImages.addAll(images.take(remaining)));
      }
    } catch (_) {
      _showMessage('Unable to access the selected images.');
    }
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  void _toggleSymptom(String symptom) {
    setState(() {
      if (!_selectedSymptoms.add(symptom)) {
        _selectedSymptoms.remove(symptom);
      }
    });
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() => _isSubmitting = true);
    await Future<void>.delayed(const Duration(milliseconds: 300));
    if (!mounted) return;

    final symptomText = _selectedSymptoms.isEmpty
        ? ''
        : '\nObserved: ${_selectedSymptoms.join(', ')}';

    appState.submitRequest(
      categoryId: _selectedCategory.id,
      categoryName: _selectedCategory.title,
      subServiceName: _selectedSubService?.name ?? _selectedCategory.title,
      issueDescription: '${_descriptionController.text.trim()}$symptomText',
      photos: _selectedImages.map((image) => image.path).toList(),
      propertyType: _propertyType,
      address: _addressController.text.trim(),
    );

    setState(() => _isSubmitting = false);
    await _showSuccessDialog();
  }

  Future<void> _showSuccessDialog() {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: AppColors.success),
            SizedBox(width: 10),
            Expanded(child: Text('Inspection submitted')),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Your details and photos were received with ₹0 upfront payment.',
              style: TextStyle(color: AppColors.textSecondary, height: 1.4),
            ),
            const SizedBox(height: 16),
            _dialogInfoRow(
              Icons.category_rounded,
              'Category',
              _selectedCategory.shortTitle,
            ),
            const SizedBox(height: 8),
            _dialogInfoRow(
              Icons.build_circle_rounded,
              'Service',
              _selectedSubService?.name ?? 'General inspection',
            ),
            const SizedBox(height: 8),
            _dialogInfoRow(
              Icons.photo_library_rounded,
              'Photos',
              _selectedImages.length.toString(),
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                Navigator.of(context).pop();
              },
              child: const Text('View all requests'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _dialogInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppColors.primaryLight),
        const SizedBox(width: 8),
        Text('$label: ', style: const TextStyle(color: AppColors.textMuted)),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final subServices = _selectedCategory.subcategories;
    final symptoms = _selectedSubService?.checklist ?? const <String>[];

    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Request inspection'),
            Text(
              'Free expert assessment',
              style: TextStyle(
                color: AppColors.textMuted,
                fontSize: 10,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(18, 6, 18, 32),
          children: [
            const _InspectionIntro(),
            const SizedBox(height: 24),
            const _SectionLabel('Select Service Category'),
            const SizedBox(height: 8),
            DropdownButtonFormField<ServiceCategory>(
              initialValue: _selectedCategory,
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.category_rounded),
              ),
              items: appState.categories
                  .map(
                    (category) => DropdownMenuItem(
                      value: category,
                      child: Text(category.shortTitle),
                    ),
                  )
                  .toList(),
              onChanged: (category) {
                if (category != null) _changeCategory(category);
              },
            ),
            if (subServices.isNotEmpty) ...[
              const SizedBox(height: 18),
              const _SectionLabel('Select Required Service'),
              const SizedBox(height: 8),
              DropdownButtonFormField<SubService>(
                key: ValueKey(_selectedCategory.id),
                initialValue: _selectedSubService,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.build_rounded),
                ),
                isExpanded: true,
                items: subServices
                    .map(
                      (service) => DropdownMenuItem(
                        value: service,
                        child: Text(
                          service.name,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    )
                    .toList(),
                onChanged: _changeSubService,
              ),
            ],
            if (symptoms.isNotEmpty) ...[
              const SizedBox(height: 18),
              const _SectionLabel('Work or Symptoms Observed'),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: symptoms
                    .map(
                      (symptom) => FilterChip(
                        label: Text(symptom),
                        selected: _selectedSymptoms.contains(symptom),
                        onSelected: (_) => _toggleSymptom(symptom),
                      ),
                    )
                    .toList(),
              ),
            ],
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const _SectionLabel('Damage Photos'),
                Text(
                  '${_selectedImages.length}/$_maxImages',
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _AddPhotoButton(
                  icon: Icons.camera_alt_rounded,
                  label: 'Camera',
                  onTap: () => _pickImage(ImageSource.camera),
                ),
                _AddPhotoButton(
                  icon: Icons.photo_library_rounded,
                  label: 'Gallery',
                  onTap: _pickMultipleImages,
                ),
                ..._selectedImages.map(_imagePreview),
              ],
            ),
            const SizedBox(height: 18),
            const _SectionLabel('Describe the Damage & Area'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'Example: Roof leaking above the ceiling fan...',
              ),
              validator: (value) => value == null || value.trim().isEmpty
                  ? 'Please describe the damage.'
                  : null,
            ),
            const SizedBox(height: 18),
            const _SectionLabel('Property Type'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _propertyTypes
                  .map(
                    (type) => ChoiceChip(
                      avatar: Icon(type.icon, size: 18),
                      label: Text(type.label),
                      selected: _propertyType == type.label,
                      onSelected: (selected) {
                        if (selected) {
                          setState(() => _propertyType = type.label);
                        }
                      },
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 18),
            const _SectionLabel('Site / Inspection Address'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(
                prefixIcon: Icon(
                  Icons.location_on_rounded,
                  color: AppColors.accent,
                ),
                hintText: 'Enter the complete site address',
              ),
              validator: (value) => value == null || value.trim().isEmpty
                  ? 'Please enter the inspection address.'
                  : null,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              child: _isSubmitting
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.verified_rounded, size: 19),
                        SizedBox(width: 8),
                        Text('Submit inspection · ₹0 upfront'),
                      ],
                    ),
            ),
            const SizedBox(height: 12),
            const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.lock_outline_rounded,
                  color: AppColors.textMuted,
                  size: 13,
                ),
                SizedBox(width: 5),
                Text(
                  'Your details are private and secure',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 10),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _imagePreview(XFile image) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: FutureBuilder(
            future: image.readAsBytes(),
            builder: (context, snapshot) {
              if (!snapshot.hasData) {
                return const SizedBox.square(
                  dimension: 88,
                  child: Center(child: CircularProgressIndicator()),
                );
              }
              return Image.memory(
                snapshot.data!,
                width: 88,
                height: 88,
                fit: BoxFit.cover,
              );
            },
          ),
        ),
        Positioned(
          right: -8,
          top: -8,
          child: IconButton.filled(
            visualDensity: VisualDensity.compact,
            iconSize: 16,
            onPressed: () => setState(() => _selectedImages.remove(image)),
            icon: const Icon(Icons.close),
          ),
        ),
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 4,
          height: 16,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 9),
        Text(
          text,
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
        ),
      ],
    );
  }
}

class _InspectionIntro extends StatelessWidget {
  const _InspectionIntro();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.auto_awesome_rounded,
                color: AppColors.accent,
                size: 18,
              ),
              SizedBox(width: 8),
              Text(
                'FAST, TRANSPARENT ESTIMATE',
                style: TextStyle(
                  color: AppColors.accentLight,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.7,
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          Text(
            'Tell us what needs attention',
            style: TextStyle(
              color: Colors.white,
              fontSize: 19,
              fontWeight: FontWeight.w800,
            ),
          ),
          SizedBox(height: 6),
          Text(
            'Add clear photos and a short description. Our estimator will prepare an itemized quotation.',
            style: TextStyle(
              color: Color(0xFFCCFBF1),
              fontSize: 11,
              height: 1.45,
            ),
          ),
          SizedBox(height: 15),
          ClipRRect(
            borderRadius: BorderRadius.all(Radius.circular(10)),
            child: LinearProgressIndicator(
              value: 0.25,
              minHeight: 5,
              backgroundColor: Color(0x3344E4D2),
              color: AppColors.accent,
            ),
          ),
          SizedBox(height: 7),
          Text(
            'Step 1 of 4 · Service details',
            style: TextStyle(color: Color(0xFF99F6E4), fontSize: 9),
          ),
        ],
      ),
    );
  }
}

class _AddPhotoButton extends StatelessWidget {
  const _AddPhotoButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 92,
        height: 92,
        decoration: BoxDecoration(
          color: AppColors.backgroundSoft,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: AppColors.primaryLight, size: 19),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }
}
