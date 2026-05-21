import { Platform } from 'react-native';

export const Palette = {
  primary: '#1A1A1A',     // Deep charcoal (Text, prominent elements)
  secondary: '#7B5E43',   // Warm brown (Accents, subtitles)
  tertiary: '#D9C5B2',    // Sandy beige (Secondary backgrounds, dividers)
  background: '#F5E6D3',  // Warm paper/cream (Main background)
  paper: '#FFF9F0',       // Lightest paper (Card background)
  paperBack: '#FAF3E8',   // Slightly different warm paper for back of ticket
  accent: '#A08E78',      // Muted gold/tan (Labels, fine details)
  text: '#1A1A1A',
  textSecondary: '#7B5E43',
  white: '#FFFFFF',
  border: '#E5D5C0',

  // New transparent colors
  secondaryTransparentLight: 'rgba(123, 94, 67, 0.1)',
  secondaryTransparentSubtle: 'rgba(123, 94, 67, 0.08)',
  secondaryTransparentMedium: 'rgba(123, 94, 67, 0.15)', // For Shadows.soft
  borderTransparentMedium: 'rgba(229, 213, 192, 0.5)',
  borderTransparentLight: 'rgba(229, 213, 192, 0.4)',
  primaryTransparentMedium: 'rgba(26, 26, 26, 0.4)',
  primaryTransparentHeavy: 'rgba(26, 26, 26, 0.8)',

  // New semantic colors
  danger: '#FF453A',
};

export const Spacing = {
  xxxs: 2, // For barcode gap
  xxxxs: 4, // For bottomShadow bottom offset
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxl_plus: 48, // Specifically for TicketCard marginBottom to denote its usage
  xxl_medium: 12, // For bottomShadow left/right offset
  xxl_large: 16, // For bottomShadow height
  huge: 64,
  toastBottom: 50,
  toastHorizontal: 40,
  headerActionsMarginBottom: 4,
  emptyButtonPaddingVertical: 18,
  emptyButtonBorderRadius: 34,
  listContentPaddingBottom: 100,
  emptyContainerPaddingBottom: 120,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  xxl: 32,
  round: 999,
  roundSmall: 8, // For smaller notches
};

export const Shadows = {
  soft: Platform.select({
    ios: {
      shadowColor: Palette.secondaryTransparentMedium,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  premium: Platform.select({
    ios: {
      shadowColor: Palette.primary,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
    },
    android: {
      elevation: 10,
    },
    default: {},
  }),
  card: Platform.select({
    ios: {
      shadowColor: Palette.primaryTransparentMedium,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
};

export const Typography = {
  h1: {
    fontSize: 36,
    fontWeight: '700' as const,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: Palette.primary,
    letterSpacing: -1,
    lineHeight: 44,
  },
  h2: {
    fontSize: 28,
    fontWeight: '600' as const,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: Palette.primary,
    lineHeight: 34,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: Palette.primary,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '400' as const,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: Palette.secondary,
    lineHeight: 24,
    fontStyle: 'italic' as const,
  },
  body: {
    fontSize: 16,
    color: Palette.primary,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Palette.accent,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  mono: {
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    color: Palette.secondary,
    letterSpacing: 0.5,
  },
  // Specialized tokens for specific contexts
  onboardingTitle: {
    fontSize: 40,
    fontWeight: '700' as const,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: Palette.background,
    letterSpacing: -1,
    lineHeight: 48,
  },
  onboardingSubtitle: {
    fontSize: 18,
    fontWeight: '400' as const,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 26,
    fontStyle: 'italic' as const,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '600' as const,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: Palette.primary,
    lineHeight: 38,
  },
  formBody: {
    fontSize: 18,
    color: Palette.primary,
    lineHeight: 28,
    fontWeight: '400' as const,
  },
  labelSmall: { // For metaLabelSmall
    fontSize: 9,
    fontWeight: '700' as const,
    color: Palette.accent,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  labelMicro: { // For footerLabel, stampText
    fontSize: 7,
    fontWeight: '700' as const,
    color: Palette.accent,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    opacity: 0.7,
  },
  titleCard: { // For titleSmall
    fontSize: 15,
    fontWeight: '600' as const,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: Palette.primary,
    lineHeight: 20,
  },
  subtitleCard: { // For note (in card variant)
    fontSize: 14,
    fontWeight: '400' as const,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: Palette.secondary,
    lineHeight: 20,
    fontStyle: 'italic' as const,
    opacity: 0.8,
  },
  monoSmall: { // For footerValueSmall
    fontSize: 9,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    color: Palette.primary,
    letterSpacing: 0.5,
    fontWeight: '600' as const,
  },
  monoMicro: { // For backLabel
    fontSize: 8,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    color: Palette.secondary,
    letterSpacing: 0.5,
    opacity: 0.4,
  },
  h2Modal: { // For modal titles
    fontSize: 24,
    fontWeight: '600' as const,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: Palette.primary,
    lineHeight: 30,
  },
  bodyModal: { // For modal messages
    fontSize: 16,
    color: Palette.secondary,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  labelModalButton: { // For modal button text
    fontSize: 11,
    fontWeight: '700' as const,
    color: Palette.background,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  backNote: { // For backNoteText
    fontSize: 18,
    fontWeight: '400' as const,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: Palette.primary,
    lineHeight: 28,
    fontStyle: 'italic' as const,
  },
  backHeaderLabel: { // For backHeaderLabel
    fontSize: 9,
    fontWeight: '700' as const,
    color: Palette.secondary,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    opacity: 0.6,
  },
  titleDetail: { // For main title in detail view
    fontSize: 26,
    fontWeight: '600' as const,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: Palette.primary,
    lineHeight: 32,
  },
  footerValueDetail: { // For main title in detail view
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    color: Palette.primary,
    letterSpacing: 0.5,
    fontWeight: '600' as const,
  },
  toast: { // For global toast messages
    fontSize: 12,
    fontWeight: '700' as const,
    color: Palette.background,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  headerLabel: { // For headerLabel
    fontSize: 11,
    fontWeight: '700' as const,
    color: Palette.secondary,
    letterSpacing: 4,
    textTransform: 'uppercase' as const,
  },
  headerTitle: { // For headerTitle
    fontSize: 42,
    fontWeight: '700' as const,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: Palette.primary,
    letterSpacing: -1,
    lineHeight: 46,
  },
  headerTitleSmall: { // For screens like Create/Detail
    fontSize: 12,
    fontWeight: '700' as const,
    color: Palette.primary,
    letterSpacing: 4,
    textTransform: 'uppercase' as const,
    opacity: 0.8,
  },
  searchInput: { // For searchInput
    fontSize: 15,
    color: Palette.primary,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  emptyText: { // For emptyText
    fontSize: 28,
    fontWeight: '600' as const,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: Palette.primary,
    lineHeight: 34,
  },
  emptySubtext: { // For emptySubtext
    fontSize: 17,
    fontWeight: '400' as const,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: Palette.secondary,
    lineHeight: 24,
    fontStyle: 'italic' as const,
    opacity: 0.7,
  },
  emptyButtonText: { // For emptyButtonText
    fontSize: 12,
    fontWeight: '700' as const,
    color: Palette.background,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
};

