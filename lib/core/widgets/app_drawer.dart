import 'package:flutter/material.dart';

import '../../features/auth/screens/login_screen.dart';
import '../../features/services/screens/create_inspection_screen.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({
    super.key,
    this.onSelectTab,
  });

  final ValueChanged<int>? onSelectTab;

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            // Top User Profile Header with Close 'X'
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 16, 20),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 24,
                    backgroundImage: NetworkImage(
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Piyush Kumar',
                          style: TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'piyush@gmail.com',
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 12.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 22),
                    color: const Color(0xFF64748B),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),

            const Divider(color: Color(0xFFF1F5F9), height: 1),

            const SizedBox(height: 12),

            // Navigation Links
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  _buildDrawerItem(
                    context: context,
                    icon: Icons.home_outlined,
                    label: 'Home',
                    onTap: () {
                      Navigator.of(context).pop();
                      onSelectTab?.call(0);
                    },
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: Icons.grid_view_rounded,
                    label: 'Services',
                    onTap: () {
                      Navigator.of(context).pop();
                      onSelectTab?.call(1);
                    },
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: Icons.folder_open_rounded,
                    label: 'Projects',
                    onTap: () {
                      Navigator.of(context).pop();
                      onSelectTab?.call(2);
                    },
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: Icons.receipt_long_outlined,
                    label: 'Quotations',
                    onTap: () {
                      Navigator.of(context).pop();
                      onSelectTab?.call(3);
                    },
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: Icons.assignment_outlined,
                    label: 'Inspections',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const CreateInspectionScreen(),
                        ),
                      );
                    },
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: Icons.person_outline_rounded,
                    label: 'Profile',
                    onTap: () {
                      Navigator.of(context).pop();
                      onSelectTab?.call(4);
                    },
                  ),
                  _buildDrawerItem(
                    context: context,
                    icon: Icons.settings_outlined,
                    label: 'Settings',
                    onTap: () {
                      Navigator.of(context).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Settings panel')),
                      );
                    },
                  ),
                ],
              ),
            ),

            // Bottom Logout Button
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
              child: ListTile(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                leading: const Icon(
                  Icons.logout_rounded,
                  color: Color(0xFFEF4444),
                  size: 22,
                ),
                title: const Text(
                  'Logout',
                  style: TextStyle(
                    color: Color(0xFFEF4444),
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                onTap: () {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(
                      builder: (context) => const LoginScreen(),
                    ),
                    (route) => false,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required BuildContext context,
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return ListTile(
      dense: true,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      leading: Icon(icon, color: const Color(0xFF334155), size: 22),
      title: Text(
        label,
        style: const TextStyle(
          color: Color(0xFF0F172A),
          fontSize: 14.5,
          fontWeight: FontWeight.w600,
        ),
      ),
      onTap: onTap,
    );
  }
}
