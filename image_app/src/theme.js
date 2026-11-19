import { Platform, useWindowDimensions } from 'react-native';

export const COLORS = {
  primary: '#1B5E20',
  primaryHover: '#164E1A',
  primaryText: '#166534',
  primaryLight: '#E6F4EA',
  primarySoft: '#DCF3DF',
  primaryBorder: '#A5D6A7',

  bg: '#F7FAF7',
  bgGradientEnd: '#ECF5EC',
  card: '#FFFFFF',
  surfaceMuted: '#F3F7F3',

  textDark: '#0F2A1D',
  textBody: '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',

  border: '#E5EAE5',
  borderStrong: '#D1DDD1',

  tileGreen: '#E4F4E7',
  tilePeach: '#FDEEDD',
  tileBlue: '#E3F0FB',
  tilePink: '#FDE8EC',

  statusBg: '#DCF3DF',
  statusText: '#1F7A34',

  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  heart: '#E11D48',
  badgeDot: '#EF4444',

  // Catalog / Print sheet (Mockup 9)
  sheetBg: '#FCF7EC',
  sheetInner: '#FFFBF2',
  sheetImageBg: '#F6EFE2',
  sheetBorder: '#DFCFB5',
  sheetBrown: '#5B3A1E',
  sheetGold: '#8C6D3F',
};

export const FONT_FAMILY = Platform.select({
  web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: undefined,
});

export const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, "Times New Roman", serif',
  default: undefined,
});

export const TYPOGRAPHY = {
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
    letterSpacing: -0.3,
  },
  section: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textBody,
    fontFamily: FONT_FAMILY,
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    fontFamily: FONT_FAMILY,
  },
};

export const RADII = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  nav: 28,
  pill: 999,
};

export const SHADOWS = {
  soft: Platform.select({
    web: {
      boxShadow: '0 6px 20px rgba(16, 24, 40, 0.06)',
    },
    default: {
      shadowColor: '#101828',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 3,
    },
  }),
  floating: Platform.select({
    web: {
      boxShadow: '0 10px 28px rgba(15, 42, 29, 0.10)',
    },
    default: {
      shadowColor: '#0F2A1D',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 8,
    },
  }),
};

export const SPACING = {
  page: 16,
  gap: 12,
  sectionGap: 20,
  tapMin: 44,
};

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  const containerMaxWidth = isDesktop ? 1240 : isTablet ? 720 : width;
  const processMaxWidth = isDesktop ? 1060 : isTablet ? 720 : width;
  const actionBarMaxWidth = isDesktop || isTablet ? 720 : width - 32;

  const horizontalPadding = isDesktop ? 24 : isTablet ? 20 : 16;
  const contentWidth = Math.min(width, containerMaxWidth) - horizontalPadding * 2;

  const categoryCols = isDesktop ? (width >= 1280 ? 5 : 4) : isTablet ? 3 : 2;
  const productCols = isDesktop ? (width >= 1280 ? 5 : 4) : isTablet ? 3 : 2;
  const outputCols = isDesktop ? (width >= 1280 ? 5 : 4) : 3;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    containerMaxWidth,
    processMaxWidth,
    actionBarMaxWidth,
    horizontalPadding,
    contentWidth,
    categoryCols,
    productCols,
    outputCols,
  };
}

export function getInitials(name, fallback = 'SS') {
  if (!name || typeof name !== 'string') return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
