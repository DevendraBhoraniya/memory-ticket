# Theme System

Memory Ticket uses a centralized design token system located in `theme/`.

## Structure

```
theme/
├── index.ts        # Barrel — exports Theme object + all tokens
├── colors.ts       # palette + colors (semantic mappings)
├── typography.ts   # Text style presets (display, body, label, mono, caption, note)
├── spacing.ts      # 8-step spacing scale (xxs–xxxl)
├── shadows.ts      # Shadow presets (subtle, elevated, artifact, fab, toast)
├── radius.ts       # Border radius presets (sharp, soft, container, card, pill, round)
└── animations.ts   # Spring & timing presets
```

## Usage

```ts
import { Theme } from '@/theme';

// Colors
Theme.colors.background  // warm paper background
Theme.colors.ink         // primary text
Theme.colors.inkMuted    // secondary text
Theme.colors.accent      // brand accent (brown)
Theme.colors.surface     // card/surface background
Theme.colors.border      // default borders
Theme.colors.danger      // destructive actions

// Spacing
Theme.spacing.xs   // 4
Theme.spacing.sm   // 8
Theme.spacing.md   // 12
Theme.spacing.lg   // 16
Theme.spacing.xl   // 24
Theme.spacing.xxl  // 32
Theme.spacing.xxxl // 48

// Typography (spread into StyleSheet)
...Theme.typography.body       // 15px regular
...Theme.typography.bodySmall  // 13px regular
...Theme.typography.display    // 24px semibold
...Theme.typography.label      // 11px uppercase, spaced
...Theme.typography.mono       // 12px monospace
...Theme.typography.caption    // 12px muted

// Border Radius
Theme.borderRadius.container  // 10
Theme.borderRadius.card       // 12
Theme.borderRadius.pill       // 9999
Theme.borderRadius.soft       // 6

// Shadows (spread into StyleSheet)
...Theme.shadows.subtle    // low-elevation card
...Theme.shadows.elevated  // modal/sheet
...Theme.shadows.artifact  // ticket card
...Theme.shadows.fab       // floating action button

// Animation
Theme.animation.spring.default  // { damping: 20, stiffness: 200 }
Theme.animation.timing.normal   // 250ms
```

## UI Primitives

Located in `components/ui/`. Each maps to theme tokens.

| Component | Import | Purpose |
|-----------|--------|---------|
| `ScreenContainer` | `import { ScreenContainer } from '@/components/ui'` | Root screen wrapper with background |
| `Button` | `import { Button } from '@/components/ui'` | Pressable with variants: primary, secondary, outline, ghost, danger |
| `IconButton` | `import { IconButton } from '@/components/ui'` | Icon-only header button |
| `HeaderBar` | `import { HeaderBar } from '@/components/ui'` | Standard header with back + title + optional right action |
| `Card` | `import { Card } from '@/components/ui'` | Surface container with border, radius, shadow |
| `Chip` | `import { Chip } from '@/components/ui'` | Selectable tag/chip |
| `SearchBar` | `import { SearchBar } from '@/components/ui'` | Search input with icon and clear button |

## Design Principles

- **Warm Paper**: Cream backgrounds (#F5F4F1), near-black ink (#1C1B18), brown accent (#7B5F43)
- **No hardcoded values**: All visual constants come from theme tokens
- **On-device**: No external dependencies — tokens are plain TypeScript objects
- **Immutable**: All token objects use `as const` for type safety
