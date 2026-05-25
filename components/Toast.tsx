import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'warning' | 'undo';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastConfig {
  message: string;
  type?: ToastType;
  action?: ToastAction;
  duration?: number;
  haptic?: boolean;
}

interface ToastContextType {
  showToast: (config: ToastConfig | string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_HEIGHT = 52;
const AUTO_DISMISS_MS = 4000;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState<ToastConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionRef = useRef<ToastAction | null>(null);
  const toastIdRef = useRef(0);

  const hide = useCallback((currentId: number) => {
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS((id: number) => {
        if (id === toastIdRef.current) {
          setVisible(false);
          setConfig(null);
        }
      })(currentId);
    });
    translateY.value = withTiming(-TOAST_HEIGHT, { duration: 250 });
  }, [opacity, translateY]);

  const startTimer = useCallback((duration: number, id: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      hide(id);
    }, duration);
  }, [hide]);

  const showToast = useCallback((cfg: ToastConfig | string, type?: ToastType) => {
    const resolved: ToastConfig = typeof cfg === 'string' ? { message: cfg, type: type || 'success' } : cfg;

    if (resolved.haptic !== false) {
      if (resolved.type === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (resolved.type === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }

    const id = ++toastIdRef.current;
    actionRef.current = resolved.action || null;
    setConfig(resolved);
    setVisible(true);

    opacity.value = 0;
    translateY.value = -80;

    opacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) });
    translateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.back(1.4)) });

    startTimer(resolved.duration || AUTO_DISMISS_MS, id);
  }, [opacity, translateY, startTimer]);

  const handleAction = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    hide(toastIdRef.current);
    actionRef.current?.onPress();
    actionRef.current = null;
  }, [hide]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const getColors = () => {
    if (!config) return { bg: Theme.colors.ink, text: Theme.colors.white, actionBg: Theme.colors.toastAction, actionText: Theme.colors.white };
    switch (config.type) {
      case 'error': return { bg: Theme.colors.danger, text: Theme.colors.white, actionBg: Theme.colors.white + '33', actionText: Theme.colors.white };
      case 'warning': return { bg: Theme.colors.warning, text: Theme.colors.white, actionBg: Theme.colors.white + '33', actionText: Theme.colors.white };
      case 'undo': return { bg: Theme.colors.ink, text: Theme.colors.white, actionBg: Theme.colors.inkMuted, actionText: Theme.colors.white };
      default: return { bg: Theme.colors.ink, text: Theme.colors.white, actionBg: Theme.colors.inkMuted, actionText: Theme.colors.white };
    }
  };

  const getIcon = () => {
    if (!config) return undefined;
    switch (config.type) {
      case 'error': return 'alert-circle';
      case 'warning': return 'warning';
      case 'undo': return 'arrow-undo';
      default: return 'checkmark-circle';
    }
  };

  const colors = getColors();
  const iconName = getIcon();

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && config && (
        <View
          style={[styles.toastContainer, { top: insets.top + 8, pointerEvents: 'box-none' }]}
        >
          <Animated.View
            style={[styles.toastInner, animatedStyle, { backgroundColor: colors.bg, borderColor: colors.bg }]}
          >
            <View style={styles.toastContent}>
              {iconName && (
                <Ionicons name={iconName as any} size={18} color={colors.text} style={{ opacity: 0.8 }} />
              )}
              <Text style={[styles.toastText, { color: colors.text }]} numberOfLines={1}>
                {config.message}
              </Text>
              {config.action && (
                <TouchableOpacity
                  onPress={handleAction}
                  style={[styles.actionBtn, { backgroundColor: colors.actionBg }]}
                  hitSlop={8}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionText, { color: colors.actionText }]}>{config.action.label}</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: Theme.spacing.lg,
    right: Theme.spacing.lg,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastInner: {
    borderRadius: 26,
    overflow: 'hidden',
    maxWidth: width - Theme.spacing.lg * 2,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: TOAST_HEIGHT,
    gap: 12,
  },
  toastText: {
    ...Theme.typography.body,
    fontSize: 13,
    flex: 1,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  actionText: {
    ...Theme.typography.label,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
