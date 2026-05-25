export const animation = {
  spring: {
    default: { damping: 28, stiffness: 150 },
    gentle: { damping: 32, stiffness: 80 },
    snappy: { damping: 16, stiffness: 250 },
    physical: { damping: 35, stiffness: 100 },
  },
  timing: {
    fast: 200,
    normal: 400,
    slow: 650,
  },
} as const;
