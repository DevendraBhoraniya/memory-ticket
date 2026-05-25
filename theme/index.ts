import { colors, palette } from './colors';
import type { ColorKey } from './colors';
import { spacing } from './spacing';
import type { SpacingKey } from './spacing';
import { radius } from './radius';
import type { RadiusKey } from './radius';
import { shadows } from './shadows';
import type { ShadowKey } from './shadows';
import { typography } from './typography';
import type { TypographyKey } from './typography';
import { animation } from './animations';

export { colors, palette };
export type { ColorKey };
export { spacing };
export type { SpacingKey };
export { radius };
export type { RadiusKey };
export { shadows };
export type { ShadowKey };
export { typography };
export type { TypographyKey };
export { animation };

export const Theme = {
  colors,
  spacing,
  borderRadius: radius,
  typography,
  shadows,
  animation,
} as const;
