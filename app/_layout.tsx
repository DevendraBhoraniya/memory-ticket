import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback, createContext, useContext, Suspense } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { SQLiteProvider } from 'expo-sqlite';

import { getOnboardingStatus, setOnboardingCompleted as saveOnboardingStatus } from '@/utils/storage';
import { Palette, Spacing, Shadows, BorderRadius, Typography } from '@/constants/theme';
import { initializeDatabase } from '@/utils/database';

// --- Onboarding Context ---
interface OnboardingContextType {
  isOnboardingCompleted: boolean | null;
  completeOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType>({
  isOnboardingCompleted: null,
  completeOnboarding: async () => {},
});

export const useOnboarding = () => useContext(OnboardingContext);

// --- Toast Context ---
interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  
  const [isReady, setIsReady] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const completeOnboarding = async () => {
    try {
      await saveOnboardingStatus();
      setIsOnboardingCompleted(true);
    } catch (e) {
      throw e;
    }
  };

  useEffect(() => {
    async function initializeApp() {
      try {
        const completed = await getOnboardingStatus();
        setIsOnboardingCompleted(completed);
      } catch (e) {
        setIsOnboardingCompleted(false);
      } finally {
        setIsReady(true);
      }
    }
    initializeApp();
  }, []);

  useEffect(() => {
    if (!isReady || isOnboardingCompleted === null) return;
    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!isOnboardingCompleted && !inOnboardingGroup) {
      router.replace('/onboarding');
    } else if (isOnboardingCompleted && inOnboardingGroup) {
      router.replace('/');
    }
  }, [isReady, isOnboardingCompleted, segments]);

  const onLayoutRootView = useCallback(async () => {
    if (isReady && isOnboardingCompleted !== null) {
      await SplashScreen.hideAsync();
    }
  }, [isReady, isOnboardingCompleted]);

  if (!isReady || isOnboardingCompleted === null) {
    return <View style={{ flex: 1, backgroundColor: Palette.background }} />;
  }
return (
  <ToastContext.Provider value={{ showToast }}>
    <OnboardingContext.Provider value={{ isOnboardingCompleted, completeOnboarding }}>
      <Suspense fallback={
        <View style={{ flex: 1, backgroundColor: Palette.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Palette.primary} />
        </View>
      }>
        <SQLiteProvider databaseName="memory_tickets.db" onInit={initializeDatabase}>
          <ThemeProvider value={DefaultTheme}>
            <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
              <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
                <Stack.Screen name="index" options={{ animation: 'fade' }} />
                <Stack.Screen name="create-ticket" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="ticket/[id]" options={{ animation: 'slide_from_right' }} />
              </Stack>

              {/* Global Toast */}
              {toast && (
                <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={[styles.toast, toast.type === 'error' && styles.toastError]}>
                  <Text style={styles.toastText}>{toast.message}</Text>
                </Animated.View>
              )}
            </View>
            <StatusBar style="auto" />
          </ThemeProvider>
        </SQLiteProvider>
      </Suspense>
    </OnboardingContext.Provider>
  </ToastContext.Provider>
);
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: Spacing.toastBottom,
    left: Spacing.toastHorizontal,
    right: Spacing.toastHorizontal,
    backgroundColor: Palette.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.premium,
    zIndex: 10000,
  },
  toastError: {
    backgroundColor: Palette.danger,
  },
  toastText: {
    ...Typography.toast,
  },
});
