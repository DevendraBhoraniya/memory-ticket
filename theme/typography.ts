import { palette } from './colors';

export const typography = {
  displayLarge: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 38,
    color: palette.ink,
  },
  display: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    lineHeight: 32,
    color: palette.ink,
  },
  displaySmall: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    lineHeight: 26,
    color: palette.ink,
  },
  title: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 22,
    color: palette.ink,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: palette.ink,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: palette.ink,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    lineHeight: 18,
    color: palette.inkMuted,
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
    color: palette.inkMuted,
  },
  labelSmall: {
    fontSize: 9,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    color: palette.inkMuted,
  },
  mono: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    color: palette.inkMuted,
  },
  monoSmall: {
    fontSize: 9,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
    color: palette.inkMuted,
  },
  note: {
    fontSize: 15,
    fontWeight: '400' as const,
    fontStyle: 'italic' as const,
    lineHeight: 24,
    color: palette.ink,
  },
} as const;

export type TypographyKey = keyof typeof typography;
