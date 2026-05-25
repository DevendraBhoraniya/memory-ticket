import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Theme } from '@/theme';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  noBorder?: boolean;
  noShadow?: boolean;
  borderRadius?: number;
}

export function Card({ children, style, noBorder = false, noShadow = false, borderRadius = 6 }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        {
          borderRadius,
          borderWidth: noBorder ? 0 : 1,
          ...(noShadow ? {} : Theme.shadows.subtle),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
});
