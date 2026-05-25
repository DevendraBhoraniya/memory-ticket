import { TouchableOpacity, Text, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Theme } from '@/theme';
import { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  activeOpacity?: number;
}

const heightMap: Record<ButtonSize, number> = { sm: 36, md: 44, lg: 56 };
const radiusMap: Record<ButtonSize, number> = { sm: 8, md: 10, lg: 12 };
const fontSizeMap: Record<ButtonSize, number> = { sm: 11, md: 12, lg: 14 };

function getVariantStyle(variant: ButtonVariant): { container: ViewStyle; text: TextStyle } {
  switch (variant) {
    case 'primary':
      return {
        container: { backgroundColor: Theme.colors.ink },
        text: { color: Theme.colors.white },
      };
    case 'secondary':
      return {
        container: { backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.border },
        text: { color: Theme.colors.ink },
      };
    case 'outline':
      return {
        container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Theme.colors.border },
        text: { color: Theme.colors.ink },
      };
    case 'ghost':
      return {
        container: { backgroundColor: 'transparent' },
        text: { color: Theme.colors.ink },
      };
    case 'danger':
      return {
        container: { backgroundColor: Theme.colors.danger },
        text: { color: Theme.colors.white },
      };
  }
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  children,
  onPress,
  style,
  activeOpacity = 0.85,
}: ButtonProps) {
  const variantStyle = getVariantStyle(variant);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={activeOpacity}
      style={[
        {
          height: heightMap[size],
          borderRadius: radiusMap[size],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: size === 'lg' ? 24 : 16,
          opacity: disabled ? 0.5 : 1,
        },
        variantStyle.container,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.text.color} />
      ) : (
        <>
          {icon}
          {children ? (
            <Text
              style={[
                {
                  ...Theme.typography.label,
                  fontSize: fontSizeMap[size],
                  letterSpacing: size === 'lg' ? 2 : 1.5,
                  fontWeight: '800',
                },
                variantStyle.text,
              ]}
            >
              {children}
            </Text>
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
}
