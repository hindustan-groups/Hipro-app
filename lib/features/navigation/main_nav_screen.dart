import 'dart:ui';
import 'package:flutter/material.dart';

import '../../core/widgets/app_drawer.dart';
import '../district/screens/adventure_categories_screen.dart';
import '../district/screens/adventure_club_screen.dart';
import '../district/screens/district_hub_screen.dart';
import '../district/screens/ent_my_bookings_screen.dart';
import '../home/screens/home_screen.dart';
import '../profile/screens/profile_screen.dart';
import '../quotations/screens/quotation_screen.dart';
import '../services/screens/service_screen.dart';

class MainNavScreen extends StatefulWidget {
  const MainNavScreen({
    super.key,
    this.initialTab = 0,
    this.initialIsAdventure = false,
  });

  final int initialTab;
  final bool initialIsAdventure;

  static void switchTab(BuildContext context, int tabIndex, {int? section}) {
    final state = context.findAncestorStateOfType<_MainNavScreenState>();
    state?.setTab(tabIndex, section: section);
  }

  static void switchToAdventure(BuildContext context, {int tabIndex = 0}) {
    final state = context.findAncestorStateOfType<_MainNavScreenState>();
    state?.switchToAdventure(tabIndex: tabIndex);
  }

  static void switchToServices(BuildContext context, {int tabIndex = 0}) {
    final state = context.findAncestorStateOfType<_MainNavScreenState>();
    state?.switchToServices(tabIndex: tabIndex);
  }

  static void toggleMode(BuildContext context) {
    final state = context.findAncestorStateOfType<_MainNavScreenState>();
    state?.toggleMode();
  }

  @override
  State<MainNavScreen> createState() => _MainNavScreenState();
}

class _MainNavScreenState extends State<MainNavScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  bool _isAdventureMode = false;
  int _serviceIndex = 0;
  int _adventureIndex = 0;

  late final PageController _servicePageController;
  late final PageController _adventurePageController;

  late final List<Widget> _serviceScreens;
  late final List<Widget> _adventureScreens;

  @override
  void initState() {
    super.initState();
    _isAdventureMode = widget.initialIsAdventure;
    if (_isAdventureMode) {
      _adventureIndex = widget.initialTab.clamp(0, 3);
    } else {
      _serviceIndex = widget.initialTab.clamp(0, 3);
    }

    _servicePageController = PageController(initialPage: _serviceIndex);
    _adventurePageController = PageController(initialPage: _adventureIndex);

    _serviceScreens = [
      HomeScreen(
        onOpenDrawer: () => _scaffoldKey.currentState?.openDrawer(),
        onSwitchTab: setTab,
      ),
      const ServicesScreen(),
      const QuotationScreen(),
      ProfileScreen(onSwitchTab: setTab),
    ];

    _adventureScreens = [
      DistrictHubScreen(
        onOpenDrawer: () => _scaffoldKey.currentState?.openDrawer(),
        isRootTab: true,
      ),
      AdventureCategoriesScreen(
        onOpenDrawer: () => _scaffoldKey.currentState?.openDrawer(),
      ),
      EntMyBookingsScreen(
        isRootTab: true,
        onOpenDrawer: () => _scaffoldKey.currentState?.openDrawer(),
      ),
      AdventureClubScreen(
        onOpenDrawer: () => _scaffoldKey.currentState?.openDrawer(),
      ),
    ];
  }

  @override
  void dispose() {
    _servicePageController.dispose();
    _adventurePageController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(MainNavScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialTab != oldWidget.initialTab) {
      setTab(widget.initialTab);
    }
    if (widget.initialIsAdventure != oldWidget.initialIsAdventure) {
      setState(() => _isAdventureMode = widget.initialIsAdventure);
    }
  }

  void switchToAdventure({int tabIndex = 0}) {
    final target = tabIndex.clamp(0, _adventureScreens.length - 1);
    setState(() {
      _isAdventureMode = true;
      _adventureIndex = target;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_adventurePageController.hasClients &&
          _adventurePageController.page?.round() != target) {
        _adventurePageController.jumpToPage(target);
      }
    });
  }

  void switchToServices({int tabIndex = 0}) {
    final target = tabIndex.clamp(0, _serviceScreens.length - 1);
    setState(() {
      _isAdventureMode = false;
      _serviceIndex = target;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_servicePageController.hasClients &&
          _servicePageController.page?.round() != target) {
        _servicePageController.jumpToPage(target);
      }
    });
  }

  void toggleMode() {
    setState(() {
      _isAdventureMode = !_isAdventureMode;
    });
  }

  void setTab(int index, {int? section}) {
    // Tab 4 is always the special mode switch button
    if (index == 4) {
      toggleMode();
      return;
    }

    if (_isAdventureMode) {
      if (index >= 0 && index < _adventureScreens.length) {
        if (_adventureIndex == index) return;
        setState(() => _adventureIndex = index);
        if (_adventurePageController.hasClients &&
            _adventurePageController.page?.round() != index) {
          _adventurePageController.animateToPage(
            index,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOutCubic,
          );
        }
      }
    } else {
      if (index >= 0 && index < _serviceScreens.length) {
        setState(() {
          if (index == 2 && section != null) {
            _serviceScreens[2] = QuotationScreen(
              key: UniqueKey(),
              initialSection: section,
            );
          }
          _serviceIndex = index;
        });
        if (_servicePageController.hasClients &&
            _servicePageController.page?.round() != index) {
          _servicePageController.animateToPage(
            index,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOutCubic,
          );
        }
      }
    }
  }

  static const List<_NavigationItem> _serviceItems = [
    _NavigationItem(
      label: 'Home',
      icon: Icons.home_outlined,
      selectedIcon: Icons.home_rounded,
    ),
    _NavigationItem(
      label: 'Services',
      icon: Icons.grid_view_outlined,
      selectedIcon: Icons.grid_view_rounded,
    ),
    _NavigationItem(
      label: 'Bookings',
      icon: Icons.calendar_month_outlined,
      selectedIcon: Icons.calendar_month_rounded,
    ),
    _NavigationItem(
      label: 'Profile',
      icon: Icons.person_outline_rounded,
      selectedIcon: Icons.person_rounded,
    ),
    _NavigationItem(
      label: 'Adventure',
      icon: Icons.paragliding_rounded,
      selectedIcon: Icons.paragliding_rounded,
      isSpecialSwitcher: true,
      switcherGradient: [Color(0xFFE11D48), Color(0xFFF97316)],
    ),
  ];

  static const List<_NavigationItem> _adventureItems = [
    _NavigationItem(
      label: 'Explore',
      icon: Icons.explore_outlined,
      selectedIcon: Icons.explore_rounded,
    ),
    _NavigationItem(
      label: 'Categories',
      icon: Icons.category_outlined,
      selectedIcon: Icons.category_rounded,
    ),
    _NavigationItem(
      label: 'Bookings',
      icon: Icons.confirmation_number_outlined,
      selectedIcon: Icons.confirmation_number_rounded,
    ),
    _NavigationItem(
      label: 'Club',
      icon: Icons.shield_outlined,
      selectedIcon: Icons.shield_rounded,
    ),
    _NavigationItem(
      label: 'Service',
      icon: Icons.home_repair_service_rounded,
      selectedIcon: Icons.home_repair_service_rounded,
      isSpecialSwitcher: true,
      switcherColor: Color(0xFF1864E8),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final activeIndex = _isAdventureMode ? _adventureIndex : _serviceIndex;
    final activeItems = _isAdventureMode ? _adventureItems : _serviceItems;
    final themeColor = _isAdventureMode ? const Color(0xFFE11D48) : const Color(0xFF1864E8);

    return PopScope(
      canPop: !_isAdventureMode,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && _isAdventureMode) {
          switchToServices();
        }
      },
      child: Scaffold(
        key: _scaffoldKey,
        drawer: AppDrawer(
          onSelectTab: (tab) {
            if (_isAdventureMode) {
              if (tab == 4) {
                switchToServices();
              } else {
                setTab(tab);
              }
            } else {
              setTab(tab);
            }
          },
        ),
        extendBody: false,
        body: AnimatedSwitcher(
          duration: const Duration(milliseconds: 280),
          child: _isAdventureMode
              ? PageView(
                  key: const ValueKey('adventure_page_view'),
                  controller: _adventurePageController,
                  physics: const PageScrollPhysics(),
                  onPageChanged: (index) {
                    setState(() => _adventureIndex = index);
                  },
                  children: _adventureScreens
                      .map((screen) => _KeepAlivePage(child: screen))
                      .toList(),
                )
              : PageView(
                  key: const ValueKey('service_page_view'),
                  controller: _servicePageController,
                  physics: const PageScrollPhysics(),
                  onPageChanged: (index) {
                    setState(() => _serviceIndex = index);
                  },
                  children: _serviceScreens
                      .map((screen) => _KeepAlivePage(child: screen))
                      .toList(),
                ),
        ),
        backgroundColor: const Color(0xFFF8FAFC),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: Colors.transparent,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F172A).withValues(alpha: 0.08),
                blurRadius: 18,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.95),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(24),
                    topRight: Radius.circular(24),
                  ),
                  border: Border.all(
                    color: _isAdventureMode
                        ? const Color(0xFFFECDD3)
                        : const Color(0xFFE2E8F0),
                    width: 1.0,
                  ),
                ),
                child: SafeArea(
                  top: false,
                  child: SizedBox(
                    height: 64,
                    child: Row(
                      children: List.generate(activeItems.length, (index) {
                        final item = activeItems[index];
                        final isSelected = !item.isSpecialSwitcher && index == activeIndex;

                        return Expanded(
                          child: _ModernNavigationItem(
                            key: ValueKey('nav_item_${item.label.toLowerCase()}'),
                            item: item,
                            selected: isSelected,
                            activeColor: themeColor,
                            onTap: () {
                              if (item.isSpecialSwitcher) {
                                toggleMode();
                              } else {
                                setTab(index);
                              }
                            },
                          ),
                        );
                      }),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ModernNavigationItem extends StatelessWidget {
  const _ModernNavigationItem({
    super.key,
    required this.item,
    required this.selected,
    required this.activeColor,
    required this.onTap,
  });

  final _NavigationItem item;
  final bool selected;
  final Color activeColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    const inactiveColor = Color(0xFF64748B);

    // Special switcher styling for the last mode toggle button
    if (item.isSpecialSwitcher) {
      final isAdventureButton = item.switcherGradient != null;

      return Semantics(
        button: true,
        label: item.label,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            splashColor: (isAdventureButton ? const Color(0xFFE11D48) : const Color(0xFF1864E8))
                .withValues(alpha: 0.12),
            highlightColor: Colors.transparent,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      gradient: isAdventureButton
                          ? LinearGradient(
                              colors: item.switcherGradient!,
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            )
                          : null,
                      color: isAdventureButton ? null : (item.switcherColor ?? const Color(0xFF1864E8)),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: (isAdventureButton ? const Color(0xFFE11D48) : const Color(0xFF1864E8))
                              .withValues(alpha: 0.35),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Icon(
                      item.icon,
                      size: 20,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    item.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: isAdventureButton ? const Color(0xFFE11D48) : const Color(0xFF1864E8),
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.1,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Semantics(
      button: true,
      selected: selected,
      label: item.label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          splashColor: activeColor.withValues(alpha: 0.08),
          highlightColor: Colors.transparent,
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeOutCubic,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: selected
                        ? activeColor.withValues(alpha: 0.12)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    selected ? item.selectedIcon : item.icon,
                    size: 22,
                    color: selected ? activeColor : inactiveColor,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  item.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: selected ? activeColor : inactiveColor,
                    fontSize: 11,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    letterSpacing: -0.1,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _KeepAlivePage extends StatefulWidget {
  final Widget child;
  const _KeepAlivePage({required this.child});

  @override
  State<_KeepAlivePage> createState() => _KeepAlivePageState();
}

class _KeepAlivePageState extends State<_KeepAlivePage>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return widget.child;
  }
}

class _NavigationItem {
  const _NavigationItem({
    required this.label,
    required this.icon,
    required this.selectedIcon,
    this.isSpecialSwitcher = false,
    this.switcherGradient,
    this.switcherColor,
  });

  final String label;
  final IconData icon;
  final IconData selectedIcon;
  final bool isSpecialSwitcher;
  final List<Color>? switcherGradient;
  final Color? switcherColor;
}
