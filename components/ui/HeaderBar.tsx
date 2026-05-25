import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/theme';
import { ReactNode } from 'react';
import { IconButton } from './IconButton';

interface HeaderBarProps {
  title: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  backIcon?: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  dark?: boolean;
}

export function HeaderBar({ title, onBack, rightAction, backIcon = 'arrow-back', dark = false }: HeaderBarProps) {
  const insets = useSafeAreaInsets();
  const c = dark ? { text: Theme.colors.white, muted: 'rgba(255,255,255,0.5)' } : { text: Theme.colors.ink, muted: Theme.colors.inkMuted };

  return (
    <View style={[styles.base, { paddingTop: insets.top + 8 }, onBack && rightAction ? styles.spaceBetween : styles.center]}>
      {onBack ? (
        <IconButton name={backIcon} size={22} color={c.muted} onPress={onBack} />
      ) : (
        <View style={{ width: 44 }} />
      )}
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      {rightAction || <View style={{ width: 44 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingBottom: 12,
  },
  spaceBetween: { justifyContent: 'space-between' },
  center: { justifyContent: 'space-between' },
  title: {
    ...Theme.typography.title,
  },
});
