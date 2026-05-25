import { TouchableOpacity, Text, ViewStyle } from 'react-native';
import { Theme } from '@/theme';

interface ChipProps {
  label: string;
  active?: boolean;
  accentColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, active = false, accentColor = Theme.colors.ink, onPress, style }: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        {
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: Theme.borderRadius.pill,
          borderWidth: 1,
          borderColor: active ? accentColor : Theme.colors.border,
          backgroundColor: active ? accentColor : Theme.colors.surface,
        },
        style,
      ]}
    >
      <Text
        style={{
          ...Theme.typography.label,
          fontSize: 9,
          color: active ? Theme.colors.white : Theme.colors.inkMuted,
        }}
      >
        {label.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}
