import { View, TextInput, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  focused?: boolean;
  style?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder = 'Search...',
  focused = false,
  style,
}: SearchBarProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          height: 40,
          paddingHorizontal: Theme.spacing.md,
          borderRadius: Theme.borderRadius.container,
          borderWidth: 1,
          borderColor: Theme.colors.border,
          gap: 8,
        },
        style,
      ]}
    >
      <Ionicons name="search-outline" size={16} color={focused ? Theme.colors.accent : Theme.colors.inkMuted} />
      <TextInput
        style={{
          flex: 1,
          ...Theme.typography.body,
          fontSize: 14,
          color: Theme.colors.ink,
          padding: 0,
        }}
        placeholder={placeholder}
        placeholderTextColor={Theme.colors.inkMuted}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={16} color={Theme.colors.inkMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}
