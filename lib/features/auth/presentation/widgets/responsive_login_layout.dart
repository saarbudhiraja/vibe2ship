import 'package:flutter/material.dart';

class ResponsiveLoginLayout extends StatelessWidget {
  final Widget logoAndBranding;
  final Widget loginCard;
  final Widget promotionalHero;

  const ResponsiveLoginLayout({
    super.key,
    required this.logoAndBranding,
    required this.loginCard,
    required this.promotionalHero,
  });

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final isMobile = mediaQuery.size.width < 600;
    final isTablet = mediaQuery.size.width >= 600 && mediaQuery.size.width < 1024;

    return Center(
      child: SingleChildScrollView(
        padding: EdgeInsets.symmetric(
          horizontal: isMobile ? 16 : 32,
          vertical: 24,
        ),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: isMobile ? 450 : (isTablet ? 900 : 1200),
          ),
          child: isMobile
              ? _buildMobileLayout(context)
              : _buildTabletDesktopLayout(context, isTablet),
        ),
      ),
    );
  }

  Widget _buildMobileLayout(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        logoAndBranding,
        const SizedBox(height: 32),
        loginCard,
      ],
    );
  }

  Widget _buildTabletDesktopLayout(BuildContext context, bool isTablet) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Left Promotional Hero Pane (Takes 50% or 55% width)
        Expanded(
          flex: isTablet ? 5 : 6,
          child: Padding(
            padding: const EdgeInsets.only(right: 48),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                logoAndBranding,
                const SizedBox(height: 32),
                promotionalHero,
              ],
            ),
          ),
        ),
        
        // Right Interactivity Form Pane
        Expanded(
          flex: 4,
          child: Card(
            elevation: 4,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
              side: BorderSide(
                color: Theme.of(context).colorScheme.outlineVariant.withOpacity(0.4),
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: loginCard,
            ),
          ),
        ),
      ],
    );
  }
}
