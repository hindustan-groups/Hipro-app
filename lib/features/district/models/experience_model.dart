enum ActivityCategory { adventure, waterSports, desertSafari, airSports, sightSeeing }

class ExperienceItem {
  final String id;
  final String title;
  final String tagline;
  final String city;
  final String locationDetails;
  final String category;
  final double rating;
  final int reviewsCount;
  final double startingPrice;
  final double? originalPrice;
  final String duration;
  final String imageUrl;
  final List<String> galleryImages;
  final List<String> inclusions;
  final List<String> safetyGuidelines;
  final List<String> availableTimeSlots;
  final String badge;
  final bool isFeatured;

  const ExperienceItem({
    required this.id,
    required this.title,
    required this.tagline,
    required this.city,
    required this.locationDetails,
    required this.category,
    required this.rating,
    required this.reviewsCount,
    required this.startingPrice,
    this.originalPrice,
    required this.duration,
    required this.imageUrl,
    this.galleryImages = const [],
    this.inclusions = const [],
    this.safetyGuidelines = const [],
    this.availableTimeSlots = const [],
    this.badge = 'POPULAR',
    this.isFeatured = false,
  });

  factory ExperienceItem.fromJson(Map<String, dynamic> json) {
    return ExperienceItem(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      tagline: json['tagline'] ?? '',
      city: json['city'] ?? '',
      locationDetails: json['locationDetails'] ?? '',
      category: json['category'] ?? '',
      rating: (json['rating'] is num) ? (json['rating'] as num).toDouble() : 4.8,
      reviewsCount: json['reviewsCount'] ?? 100,
      startingPrice: (json['startingPrice'] is num) ? (json['startingPrice'] as num).toDouble() : 0.0,
      originalPrice: (json['originalPrice'] is num) ? (json['originalPrice'] as num).toDouble() : null,
      duration: json['duration'] ?? '',
      imageUrl: json['imageUrl'] ?? '',
      galleryImages: (json['gallery'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          (json['galleryImages'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          const [],
      inclusions: (json['inclusions'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? const [],
      safetyGuidelines: (json['safetyGuidelines'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? const [],
      availableTimeSlots: (json['slots'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          (json['availableTimeSlots'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          const [],
      badge: json['discountBadge'] ?? json['badge'] ?? 'POPULAR',
      isFeatured: json['isFeatured'] ?? false,
    );
  }

  static List<ExperienceItem> get mockExperiences => [
        const ExperienceItem(
          id: 'exp_paraglide_dehradun',
          title: 'Tandem Paragliding Flight',
          tagline: 'High-altitude glide over lush Doon hills with GoPro 4K recording',
          city: 'Dehradun',
          locationDetails: 'Maldevta Adventure Point, Dehradun, Uttarakhand',
          category: 'Air Sports',
          rating: 4.9,
          reviewsCount: 384,
          startingPrice: 2499,
          originalPrice: 3499,
          duration: '20 - 30 Mins Flight',
          imageUrl:
              'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=800&q=80',
          galleryImages: [
            'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1499244571948-7ccddb3583f1?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          ],
          inclusions: [
            'Certified Tandem Pilot with 10+ yrs experience',
            'Full HD 4K GoPro Video & Photos transfer',
            'High-grade safety harness & certified helmet',
            'Takeoff point 4x4 pickup from landing base',
            'Complementary mountain tea & briefing'
          ],
          safetyGuidelines: [
            'Weight requirement: 35 kg to 95 kg',
            'Wear comfortable sports shoes (mandatory)',
            'Not recommended for people with severe cardiac issues',
            'Activity subject to clear wind and weather conditions'
          ],
          availableTimeSlots: [
            '07:30 AM (Sunrise Breeze)',
            '09:30 AM (Morning Thermal)',
            '11:30 AM (Valley View)',
            '03:30 PM (Afternoon Soar)',
            '05:00 PM (Golden Sunset Slot)'
          ],
          badge: 'TOP ADVENTURE',
          isFeatured: true,
        ),
        const ExperienceItem(
          id: 'exp_desert_jaisalmer',
          title: 'Sam Dunes Desert Safari & Dune Bashing',
          tagline: 'Thrilling 4x4 Thar ride, sunset camel trek & Rajasthani cultural gala',
          city: 'Jaisalmer',
          locationDetails: 'Sam Sand Dunes, Thar Desert, Jaisalmer, Rajasthan',
          category: 'Desert Safari',
          rating: 4.8,
          reviewsCount: 520,
          startingPrice: 1850,
          originalPrice: 2500,
          duration: '4 - 5 Hours Experience',
          imageUrl:
              'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80',
          galleryImages: [
            'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
          ],
          inclusions: [
            'High-octane 4x4 customized Thar dune bashing (20 mins)',
            'Sunset Camel ride through silky sand crests',
            'Welcome Aarti, Tikka & authentic Rajasthani tea/snacks',
            'Live Kalbelia folk dance & musical performance',
            'Buffet traditional dinner with Dal Baati Churma'
          ],
          safetyGuidelines: [
            'Fasten safety seatbelts during dune bashing',
            'Sun protection / sunglasses strongly advised',
            'Elderly guests can request moderate driving speed',
          ],
          availableTimeSlots: [
            '03:30 PM (Sunset Dune Adventure)',
            '04:30 PM (Evening Sunset & Cultural Gala)',
            '07:00 PM (Night Stargazing & Camp Gala)'
          ],
          badge: 'BESTSELLER',
          isFeatured: true,
        ),
        const ExperienceItem(
          id: 'exp_bungee_rishikesh',
          title: 'Mohan Chatti 83m Bungee Jumping',
          tagline: 'India’s highest cantilever bungee jump over river Hall valley with SANZ certified masters',
          city: 'Rishikesh',
          locationDetails: 'Mohan Chatti, Jump Zone, Rishikesh, Uttarakhand',
          category: 'Adventure',
          rating: 4.9,
          reviewsCount: 780,
          startingPrice: 3700,
          originalPrice: 4500,
          duration: '1.5 Hours Experience',
          imageUrl:
              'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
          galleryImages: [
            'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
          ],
          inclusions: [
            '83m Cantilever Bungee Jump designed by SANZ (New Zealand)',
            'Dare to Jump Certificate & official jumper badge',
            'Full HD safety jump recording cameras',
            'Recovery crew assistance at the riverbed platform',
          ],
          safetyGuidelines: [
            'Weight limits: 40 kg to 110 kg strictly enforced',
            'Wear comfortable sports shoes & fitted clothes',
            'Not allowed for individuals with high blood pressure or cardiac conditions',
          ],
          availableTimeSlots: [
            '09:30 AM (Morning Dare)',
            '11:30 AM (Valley Jump)',
            '01:30 PM (Afternoon Leap)',
            '03:30 PM (Sunset Thrill)',
          ],
          badge: 'EXTREME THRILL',
          isFeatured: true,
        ),
        const ExperienceItem(
          id: 'exp_paramotor_jaisalmer',
          title: 'Aerial Desert Paramotoring & Parashoot Ride',
          tagline: 'Fly 1000 ft above the golden sand ocean on a powered motorized parashoot glider',
          city: 'Jaisalmer',
          locationDetails: 'Desert National Park Road, Sam, Jaisalmer',
          category: 'Air Sports',
          rating: 4.9,
          reviewsCount: 215,
          startingPrice: 2999,
          originalPrice: 3999,
          duration: '15 Mins Flight',
          imageUrl:
              'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
          galleryImages: [
            'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=800&q=80',
          ],
          inclusions: [
            'Certified microlight/paramotor pilot',
            'Bird-eye aerial photography and desert footage',
            'All aviation-grade safety gear included',
            'Pre-flight safety instructions and communication headset'
          ],
          safetyGuidelines: [
            'Age limit: 8 years and above',
            'Maximum body weight: 100 kg',
            'Listen carefully to pilot takeoff and landing stance'
          ],
          availableTimeSlots: [
            '06:30 AM (Sunrise Flight)',
            '08:00 AM (Desert Glow Slot)',
            '04:30 PM (Golden Dune Sunset Flight)',
            '05:30 PM (Twilight Horizon Flight)'
          ],
          badge: 'UNIQUE EXP',
          isFeatured: true,
        ),
        const ExperienceItem(
          id: 'exp_rafting_rishikesh',
          title: 'Ganga White Water River Rafting',
          tagline: 'Conquer thrilling Grade III+ rapids like Roller Coaster & Golf Course',
          city: 'Rishikesh',
          locationDetails: 'Shivpuri Base to NIM Beach, Rishikesh',
          category: 'Water Sports',
          rating: 4.9,
          reviewsCount: 940,
          startingPrice: 1199,
          originalPrice: 1800,
          duration: '16 Km (2.5 - 3 Hours)',
          imageUrl:
              'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
          galleryImages: [
            'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          ],
          inclusions: [
            'US Coast Guard approved life jackets and high-impact helmets',
            'Professional IRF certified river guide with safety kayak',
            'Cliff jumping & body surfing session included',
            'Transportation from office to rafting launch point'
          ],
          safetyGuidelines: [
            'Non-swimmers can comfortably participate with life vests',
            'Minimum age: 14 years',
            'Avoid carrying valuables on the raft'
          ],
          availableTimeSlots: [
            '08:00 AM (Early Rush Rapids)',
            '10:30 AM (Mid-Morning Sun)',
            '01:30 PM (Afternoon Rapid Ride)',
            '03:30 PM (Sunset Rapids)'
          ],
          badge: 'ADRENALINE',
          isFeatured: false,
        ),
        const ExperienceItem(
          id: 'exp_balloon_dehradun',
          title: 'Hot Air Balloon Sunrise Float',
          tagline: 'Spectacular 360-degree panoramic flight over the Himalayan foothills',
          city: 'Dehradun',
          locationDetails: 'Sahastradhara Valley, Dehradun',
          category: 'Air Sports',
          rating: 5.0,
          reviewsCount: 130,
          startingPrice: 6999,
          originalPrice: 9500,
          duration: '45 - 60 Mins Flight',
          imageUrl:
              'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=800&q=80',
          galleryImages: [
            'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=800&q=80',
          ],
          inclusions: [
            'Commercial airline licensed balloon pilot',
            'First flight certificate signed by pilot',
            'Champagne/juice sunrise toast at landing',
            'Pre-flight balloon inflation walkthrough'
          ],
          safetyGuidelines: [
            'Dress in layers as mornings in the basket can be cool',
            'Pregnant women not permitted for landing safety',
            'Children above 5 years allowed'
          ],
          availableTimeSlots: [
            '06:00 AM (Dawn Lift Off)',
            '07:00 AM (Morning Golden Flight)'
          ],
          badge: 'LUXURY',
          isFeatured: false,
        ),
        const ExperienceItem(
          id: 'exp_quad_jaisalmer',
          title: 'ATV Quad Biking on Sand Dunes',
          tagline: 'Take control of a 700cc monster ATV across open rolling desert terrain',
          city: 'Jaisalmer',
          locationDetails: 'Kuldhara Desert Trail, Jaisalmer',
          category: 'Desert Safari',
          rating: 4.8,
          reviewsCount: 310,
          startingPrice: 1499,
          originalPrice: 2000,
          duration: '30 Mins Ride',
          imageUrl:
              'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=800&q=80',
          galleryImages: [
            'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=800&q=80',
          ],
          inclusions: [
            'High-torque polaris 4x4 automatic ATV bike',
            'Full face dust helmet & protective gloves',
            'Trail marshal guiding the dune course',
            'Speed training on flat ground prior to dunes'
          ],
          safetyGuidelines: [
            'Age: 16+ to drive solo, pillion option for younger kids',
            'Follow trail marshal signals at all times'
          ],
          availableTimeSlots: [
            '08:00 AM',
            '10:00 AM',
            '04:00 PM',
            '05:30 PM (Sunset Run)'
          ],
          badge: 'TRENDING',
          isFeatured: false,
        ),
      ];
}

class ExperienceBookingModel {
  final String bookingId;
  final String experienceId;
  final String experienceTitle;
  final String city;
  final String location;
  final String selectedDate;
  final String selectedTimeSlot;
  final int guestCount;
  final double perPersonPrice;
  final double totalPrice;
  final String customerName;
  final String customerPhone;
  final DateTime bookedAt;
  final String status;

  ExperienceBookingModel({
    required this.bookingId,
    required this.experienceId,
    required this.experienceTitle,
    required this.city,
    required this.location,
    required this.selectedDate,
    required this.selectedTimeSlot,
    required this.guestCount,
    required this.perPersonPrice,
    required this.totalPrice,
    required this.customerName,
    required this.customerPhone,
    required this.bookedAt,
    this.status = 'CONFIRMED',
  });
}
