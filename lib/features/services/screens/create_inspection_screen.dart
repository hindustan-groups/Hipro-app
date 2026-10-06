import 'package:flutter/material.dart';

import '../../../main.dart';
import '../models/service_model.dart';
import 'inspection_success_screen.dart';

class CreateInspectionScreen extends StatefulWidget {
  const CreateInspectionScreen({
    super.key,
    this.preselectedService,
  });

  final ServiceItem? preselectedService;

  @override
  State<CreateInspectionScreen> createState() => _CreateInspectionScreenState();
}

class _CreateInspectionScreenState extends State<CreateInspectionScreen> {
  int _currentStep = 1;

  // Form Fields
  String _selectedCategory = 'Plumbing';
  String _selectedSubService = 'Leakage Inspection';
  final TextEditingController _descriptionController = TextEditingController();
  String _propertyType = 'Residential Villa';
  final TextEditingController _areaController =
      TextEditingController(text: '1500');
  final TextEditingController _addressController =
      TextEditingController(text: 'Plot 42, Subhash Nagar, Bhilwara');
  final TextEditingController _cityController =
      TextEditingController(text: 'Bhilwara, Rajasthan');
  String _preferredTime = 'Morning (09:00 AM - 12:00 PM)';

  final List<String> _categories = [
    'Plumbing',
    'Civil Construction',
    'Architectural Design',
    'Survey & Mapping',
    'Waterproofing',
    'Maintenance',
  ];

  final Map<String, List<String>> _subServices = {
    'Plumbing': [
      'Leakage Inspection',
      'Pipe Replacement',
      'Sanitary Fitting',
      'Drainage Assessment',
    ],
    'Civil Construction': [
      'Foundation Check',
      'Structure Audit',
      'Renovation Planning',
      'Concrete Assessment',
    ],
    'Architectural Design': [
      '2D Layout Planning',
      '3D Elevation Design',
      'Interior Space Plan',
    ],
    'Survey & Mapping': [
      'Land Boundary Survey',
      'Topographical Mapping',
      'GIS Assessment',
    ],
    'Waterproofing': [
      'Roof Seepage Inspection',
      'Basement Dampness Test',
      'Wall Crack Injections',
    ],
    'Maintenance': [
      'Annual Maintenance Visit',
      'Plumbing & Electric Check',
      'Paint & Polish Audit',
    ],
  };

  @override
  void initState() {
    super.initState();
    if (widget.preselectedService != null) {
      if (_categories.contains(widget.preselectedService!.name)) {
        _selectedCategory = widget.preselectedService!.name;
      }
    }
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _areaController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  void _onNext() {
    if (_currentStep < 4) {
      setState(() => _currentStep++);
    } else {
      // Submit and redirect to success
      appState.submitRequest(
        categoryId: 'cat_${_selectedCategory.toLowerCase()}',
        categoryName: _selectedCategory,
        subServiceName: _selectedSubService,
        issueDescription: _descriptionController.text.isNotEmpty
            ? _descriptionController.text
            : 'Inspection required for $_selectedSubService.',
        photos: [
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
        ],
        propertyType: _propertyType,
        address: '${_addressController.text}, ${_cityController.text}',
      );

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => const InspectionSuccessScreen(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
            } else {
              Navigator.of(context).pop();
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
                  onPressed: _onNext,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1864E8),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
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
    );
  }

  Widget _buildStepper() {
    final steps = ['Service', 'Details', 'Photos', 'Location'];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: List.generate(steps.length, (index) {
          final stepNum = index + 1;
          final isActive = stepNum <= _currentStep;
          final isCurrent = stepNum == _currentStep;

          return Row(
            children: [
              Column(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: isActive
                          ? const Color(0xFF1864E8)
                          : const Color(0xFFF1F5F9),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '$stepNum',
                        style: TextStyle(
                          color: isActive ? Colors.white : const Color(0xFF94A3B8),
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    steps[index],
                    style: TextStyle(
                      color: isCurrent
                          ? const Color(0xFF0F172A)
                          : const Color(0xFF94A3B8),
                      fontSize: 11.5,
                      fontWeight:
                          isCurrent ? FontWeight.w700 : FontWeight.w500,
                    ),
                  ),
                ],
              ),
              if (index < steps.length - 1)
                Container(
                  width: MediaQuery.of(context).size.width * 0.12,
                  height: 2,
                  margin: const EdgeInsets.only(bottom: 20, left: 6, right: 6),
                  color: stepNum < _currentStep
                      ? const Color(0xFF1864E8)
                      : const Color(0xFFE2E8F0),
                ),
            ],
          );
        }),
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

  Widget _buildStep1Service() {
    final subList = _subServices[_selectedCategory] ?? ['General Assessment'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Select Service Category',
          style: TextStyle(
            color: Color(0xFF334155),
            fontSize: 13.5,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: _selectedCategory,
              icon: const Icon(
                Icons.keyboard_arrow_down_rounded,
                color: Color(0xFF64748B),
              ),
              items: _categories.map((cat) {
                return DropdownMenuItem(
                  value: cat,
                  child: Text(
                    cat,
                    style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 14.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) {
                  setState(() {
                    _selectedCategory = val;
                    _selectedSubService =
                        (_subServices[val] ?? ['General Assessment']).first;
                  });
                }
              },
            ),
          ),
        ),

        const SizedBox(height: 20),

        const Text(
          'Select Sub Service',
          style: TextStyle(
            color: Color(0xFF334155),
            fontSize: 13.5,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: subList.contains(_selectedSubService)
                  ? _selectedSubService
                  : subList.first,
              icon: const Icon(
                Icons.keyboard_arrow_down_rounded,
                color: Color(0xFF64748B),
              ),
              items: subList.map((sub) {
                return DropdownMenuItem(
                  value: sub,
                  child: Text(
                    sub,
                    style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 14.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) {
                  setState(() => _selectedSubService = val);
                }
              },
            ),
          ),
        ),

        const SizedBox(height: 20),

        const Text(
          'Description',
          style: TextStyle(
            color: Color(0xFF334155),
            fontSize: 13.5,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          height: 140,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            children: [
              Expanded(
                child: TextField(
                  controller: _descriptionController,
                  maxLines: null,
                  maxLength: 500,
                  buildCounter: (
                    context, {
                    required currentLength,
                    required isFocused,
                    maxLength,
                  }) {
                    return Align(
                      alignment: Alignment.bottomRight,
                      child: Text(
                        '$currentLength/$maxLength',
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 11.5,
                        ),
                      ),
                    );
                  },
                  decoration: const InputDecoration(
                    hintText: 'Describe the issue or work required...',
                    hintStyle: TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 13.5,
                    ),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),
            ],
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
        const Text(
          'Property Type',
          style: TextStyle(
            color: Color(0xFF334155),
            fontSize: 13.5,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: _propertyType,
              items: types.map((t) {
                return DropdownMenuItem(
                  value: t,
                  child: Text(t, style: const TextStyle(fontWeight: FontWeight.w600)),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _propertyType = val);
              },
            ),
          ),
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
          'Upload Photos / Site Evidence',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Add clear photos of the damage, seepage, or work site.',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
        ),
        const SizedBox(height: 20),
        Container(
          width: double.infinity,
          height: 160,
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: const Color(0xFF1864E8).withValues(alpha: 0.4),
              style: BorderStyle.solid,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Icon(
                Icons.cloud_upload_outlined,
                color: Color(0xFF1864E8),
                size: 38,
              ),
              SizedBox(height: 10),
              Text(
                'Tap to browse or take photos',
                style: TextStyle(
                  color: Color(0xFF1864E8),
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Supports JPG, PNG up to 10MB',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
            ],
          ),
        ),
      ],
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
        const Text(
          'Preferred Slot',
          style: TextStyle(
            color: Color(0xFF334155),
            fontSize: 13.5,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: _preferredTime,
              items: [
                'Morning (09:00 AM - 12:00 PM)',
                'Afternoon (01:00 PM - 04:00 PM)',
                'Evening (04:00 PM - 07:00 PM)',
              ].map((s) {
                return DropdownMenuItem(value: s, child: Text(s));
              }).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _preferredTime = val);
              },
            ),
          ),
        ),
      ],
    );
  }
}
