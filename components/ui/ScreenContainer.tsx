import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/theme';
import { ReactNode } from 'react';

interface ScreenContainerProps {
  children: ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
  edges?: ('top' | 'bottom')[];
}

export function ScreenContainer({ children, backgroundColor = Theme.colors.background, style, edges }: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  const paddingTop = edges?.includes('top') ? insets.top : 0;
  const paddingBottom = edges?.includes('bottom') ? insets.bottom : 0;

  return (
    <View
      style={[
        styles.base,
        { backgroundColor, paddingTop, paddingBottom },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },
});
