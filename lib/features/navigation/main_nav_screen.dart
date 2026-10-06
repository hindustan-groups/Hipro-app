import 'package:flutter/material.dart';

import '../../core/widgets/app_drawer.dart';
import '../home/screens/home_screen.dart';
import '../profile/screens/profile_screen.dart';
import '../projects/screens/projects_screen.dart';
import '../quotations/screens/quotation_screen.dart';
import '../services/screens/service_screen.dart';

class MainNavScreen extends StatefulWidget {
  const MainNavScreen({super.key, this.initialTab = 0});

  final int initialTab;

  static void switchTab(BuildContext context, int tabIndex) {
    final state = context.findAncestorStateOfType<_MainNavScreenState>();
    state?.setTab(tabIndex);
  }

  @override
  State<MainNavScreen> createState() => _MainNavScreenState();
}

class _MainNavScreenState extends State<MainNavScreen> {
  late int _currentIndex;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialTab;
  }

  void setTab(int index) {
    setState(() => _currentIndex = index);
  }

  static const List<_NavigationItem> _items = [
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
      label: 'Projects',
      icon: Icons.construction_outlined,
      selectedIcon: Icons.construction_rounded,
    ),
    _NavigationItem(
      label: 'Quotes',
      icon: Icons.receipt_long_outlined,
      selectedIcon: Icons.receipt_long_rounded,
    ),
    _NavigationItem(
      label: 'Profile',
      icon: Icons.person_outline_rounded,
      selectedIcon: Icons.person_rounded,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(
        onOpenDrawer: () => _scaffoldKey.currentState?.openDrawer(),
        onSwitchTab: setTab,
      ),
      const ServicesScreen(),
      const ProjectsScreen(),
      const QuotationScreen(),
      ProfileScreen(onSwitchTab: setTab),
    ];

    return Scaffold(
      key: _scaffoldKey,
      drawer: AppDrawer(onSelectTab: setTab),
      extendBody: true,
      body: IndexedStack(index: _currentIndex, children: screens),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(24, 0, 24, 12),
        child: Container(
          height: 58,
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(29),
            border: Border.all(color: const Color(0xFFF1F5F9), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F172A).withValues(alpha: 0.08),
                blurRadius: 24,
                spreadRadius: 1,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final unitWidth = constraints.maxWidth / (_items.length + 1);
              return Row(
                children: List.generate(_items.length, (index) {
                  final selected = index == _currentIndex;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 240),
                    curve: Curves.easeOutCubic,
                    width: selected ? unitWidth * 2 : unitWidth,
                    child: _NavigationButton(
                      item: _items[index],
                      selected: selected,
                      onTap: () => setTab(index),
                    ),
                  );
                }),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _NavigationButton extends StatelessWidget {
  const _NavigationButton({
    required this.item,
    required this.selected,
    required this.onTap,
  });

  final _NavigationItem item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: item.label,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 1.5),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(24),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 240),
              curve: Curves.easeOutCubic,
              height: 48,
              padding: EdgeInsets.symmetric(horizontal: selected ? 8 : 2),
              decoration: BoxDecoration(
                color: selected
                    ? const Color(0xFFEBF2FE)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 180),
                    child: Icon(
                      selected ? item.selectedIcon : item.icon,
                      key: ValueKey(selected),
                      size: 20,
                      color: selected
                          ? const Color(0xFF1864E8)
                          : const Color(0xFF94A3B8),
                    ),
                  ),
                  if (selected) ...[
                    const SizedBox(width: 5),
                    Flexible(
                      child: Text(
                        item.label,
                        maxLines: 1,
                        overflow: TextOverflow.fade,
                        softWrap: false,
                        style: const TextStyle(
                          color: Color(0xFF1864E8),
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.1,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavigationItem {
  const _NavigationItem({
    required this.label,
    required this.icon,
    required this.selectedIcon,
  });

  final String label;
  final IconData icon;
  final IconData selectedIcon;
}
