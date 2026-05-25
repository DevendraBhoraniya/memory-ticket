export const radius = {
  sharp: 2,
  soft: 6,
  container: 8,
  card: 6,
  pill: 9999,
  round: 100,
} as const;

export type RadiusKey = keyof typeof radius;
