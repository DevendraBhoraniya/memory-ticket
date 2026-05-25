import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Theme } from '@/theme';
import { useEffect, useState, createContext, useContext } from 'react';
import { getOnboardingStatus, setOnboardingCompleted as saveOnboardingStatus, getAllUsedUris, flushExpiredDeletes } from '@/utils/storage';
import { View, ActivityIndicator, Image, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { cleanupOrphanedImages } from '@/utils/image';

// Keep splash visible while we check onboarding
SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

const NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Theme.colors.background,
    card: Theme.colors.card,
    text: Theme.colors.ink,
    border: Theme.colors.border,
  },
};

interface OnboardingContextType {
  isOnboardingCompleted: boolean | null;
  completeOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType>({
  isOnboardingCompleted: null,
  completeOnboarding: async () => {},
});

export const useOnboarding = () => useContext(OnboardingContext);

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkStatus() {
      const status = await getOnboardingStatus();
      setIsOnboardingCompleted(status);
      // Clean up expired soft-delete image files
      await flushExpiredDeletes();
      // Clean up any orphaned files no longer referenced by any ticket
      const usedUris = await getAllUsedUris();
      await cleanupOrphanedImages(usedUris);
      await SplashScreen.hideAsync();
    }
    checkStatus();
  }, []);

  useEffect(() => {
    if (isOnboardingCompleted === null) return;
    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!isOnboardingCompleted && !inOnboardingGroup) {
      router.replace('/onboarding');
    } else if (isOnboardingCompleted && inOnboardingGroup) {
      router.replace('/');
    }
  }, [isOnboardingCompleted, segments]);

  const completeOnboarding = async () => {
    await saveOnboardingStatus();
    setIsOnboardingCompleted(true);
  };

  if (isOnboardingCompleted === null) {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={require('../assets/images/splash-icon.png')}
          style={{ width: 80, height: 80, marginBottom: 24 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="small" color={Theme.colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
        <ToastProvider>
          <ThemeProvider value={NavTheme}>
            <OnboardingContext.Provider value={{ isOnboardingCompleted, completeOnboarding }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: {
                    backgroundColor: Theme.colors.background,
                  },
                  animation: 'fade_from_bottom',
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
                <Stack.Screen name="editor" options={{ presentation: 'modal' }} />
                <Stack.Screen name="ticket/[id]" />
                <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
              </Stack>
              <StatusBar style="dark" />
            </OnboardingContext.Provider>
          </ThemeProvider>
        </ToastProvider>
      </View>
    </SafeAreaProvider>
  );
}
