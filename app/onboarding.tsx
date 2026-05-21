import MemoryTicket from '@/components/MemoryTicket';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Shadows, Spacing, Typography } from '@/constants/theme';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken,
} from 'react-native';
import Animated, {
    Extrapolate,
    FadeIn,
    FadeInDown,
    interpolate,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from './_layout';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  type: 'welcome' | 'archive' | 'capture' | 'keepsake';
}

const STEPS: OnboardingStep[] = [
  {
    id: '1',
    title: 'Archive Your\nFavorite Moments',
    subtitle: 'Turn fleeting instances into collectible digital memory stubs.',
    type: 'welcome',
  },
  {
    id: '2',
    title: 'Your Life,\nCurated.',
    subtitle: 'A cinematic timeline of the places and feelings that define you.',
    type: 'archive',
  },
  {
    id: '3',
    title: 'Capture the\nSilent Details',
    subtitle: 'Every photo holds a story. Preserve the texture of your memories.',
    type: 'capture',
  },
  {
    id: '4',
    title: 'A Digital\nKeepsake',
    subtitle: 'Start your personal collection of memories today.',
    type: 'keepsake',
  },
];

const ONBOARDING_ASSETS = {
  welcome: 'https://images.unsplash.com/photo-1516641396056-0ce60a85d49f?q=80&w=1000&auto=format&fit=crop',
  archive: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=1000&auto=format&fit=crop',
  capture: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000&auto=format&fit=crop',
  keepsake: 'https://images.unsplash.com/photo-1526289037004-212ca58964a7?q=80&w=1000&auto=format&fit=crop',
};

// Memoized Step Components for performance
const WelcomeStep = memo(() => (
  <View style={styles.fullScreen}>
    <Image source={{ uri: ONBOARDING_ASSETS.welcome }} style={styles.fullScreenImage} contentFit="cover" cachePolicy="memory-disk" />
    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient} />
  </View>
));

const ArchiveStep = memo(() => {
  return (
    <View style={[styles.fullScreen, { backgroundColor: Palette.background }]}>
      <View style={styles.archiveVisual}>
        <Animated.View 
          entering={FadeIn.delay(200).duration(800)}
          style={[styles.floatingCard, { left: width * 0.1, top: 50 }]}
        >
          <Animated.View style={{ transform: [{ rotate: '-10deg' }, { translateX: -20 }] }}>
            <MemoryTicket ticket={{ title: 'Summer in Paris', date: 'July 2024', photoUri: ONBOARDING_ASSETS.archive }} variant="card" />
          </Animated.View>
        </Animated.View>
        <Animated.View 
          entering={FadeIn.delay(400).duration(800)}
          style={[styles.floatingCard, { zIndex: 10, right: width * 0.1, bottom: 50 }]}
        >
          <Animated.View style={{ transform: [{ rotate: '5deg' }, { translateY: 20 }] }}>
            <MemoryTicket ticket={{ title: 'Mountain Hike', date: 'Aug 2024', photoUri: ONBOARDING_ASSETS.welcome }} variant="card" />
          </Animated.View>
        </Animated.View>
      </View>
      <LinearGradient colors={['transparent', Palette.background]} style={[styles.gradient, { height: '50%' }]} />
    </View>
  );
});

const CaptureStep = memo(() => (
  <View style={[styles.fullScreen, { backgroundColor: Palette.background }]}>
    <View style={styles.captureVisual}>
      <Animated.View entering={FadeIn.duration(1000)} style={styles.mainTicket}>
        <MemoryTicket 
          ticket={{ 
            title: 'Capture the Moment', 
            date: 'Today', 
            location: 'Anywhere',
            photoUri: ONBOARDING_ASSETS.capture 
          }} 
          variant="detail" 
        />
      </Animated.View>
      <Animated.View 
        entering={FadeIn.delay(600).duration(800)}
        style={styles.cameraCircle}
      >
         <IconSymbol name="photo.fill" size={32} color={Palette.primary} />
      </Animated.View>
    </View>
    <LinearGradient colors={['transparent', Palette.background]} style={[styles.gradient, { height: '50%' }]} />
  </View>
));

const KeepsakeStep = memo(() => (
  <View style={[styles.fullScreen, { backgroundColor: Palette.background }]}>
    <View style={styles.keepsakeVisual}>
       <View style={styles.ticketStack}>
          {[1, 2].map((i) => (
            <Animated.View 
              key={i} 
              entering={FadeIn.delay(i * 200).duration(800)}
              style={[styles.stackItem, { transform: [{ rotate: `${(i === 1 ? -12 : 8)}deg` }, { translateX: (i === 1 ? -30 : 30) }] }]}
            >
               <MemoryTicket 
                 ticket={{ 
                   title: i === 1 ? 'A Quiet Moment' : 'Golden Hour', 
                   date: i === 1 ? 'June 2024' : 'Sept 2024',
                   photoUri: i === 1 ? ONBOARDING_ASSETS.welcome : ONBOARDING_ASSETS.archive
                 }} 
                 variant="card" 
               />
            </Animated.View>
          ))}
          <Animated.View entering={FadeIn.delay(600).duration(1000)} style={styles.topTicket}>
            <MemoryTicket 
              ticket={{ 
                title: 'My Digital Keepsake', 
                date: 'Always', 
                photoUri: ONBOARDING_ASSETS.keepsake 
              }} 
              variant="detail" 
            />
          </Animated.View>
       </View>
    </View>
    <LinearGradient colors={['transparent', Palette.background]} style={[styles.gradient, { height: '50%' }]} />
  </View>
));

const OnboardingItem = memo(({ item, index }: { item: OnboardingStep; index: number }) => {
  return (
    <View style={styles.stepContainer}>
      {item.type === 'welcome' && <WelcomeStep />}
      {item.type === 'archive' && <ArchiveStep />}
      {item.type === 'capture' && <CaptureStep />}
      {item.type === 'keepsake' && <KeepsakeStep />}

      <View style={styles.contentOverlay}>
        <Animated.View entering={FadeInDown.delay(300).duration(800)}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </Animated.View>
      </View>
    </View>
  );
});

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const scrollX = useSharedValue(0);

  const handleScroll = useCallback((event: any) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index ?? 0;
      setCurrentIndex(index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleFinish = async () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    try {
      // 1. Await persistence AND root state update
      await completeOnboarding();

      // 2. Perform navigation
      router.replace('/');
    } catch (e) {
      setIsTransitioning(false);
    }
  };

  const handleNext = () => {
    if (isTransitioning) return;

    if (currentIndex < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleFinish();
    }
  };

  const renderItem = useCallback(({ item, index }: { item: OnboardingStep; index: number }) => (
    <OnboardingItem item={item} index={index} />
  ), []);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={STEPS}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        bounces={false}
        snapToInterval={width}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(item) => item.id}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={true}
      />

      <SafeAreaView style={styles.footer} edges={['bottom']} pointerEvents={isTransitioning ? 'none' : 'auto'}>
        <View style={styles.paginationContainer}>
          {STEPS.map((_, i) => {
            const animatedDotStyle = useAnimatedStyle(() => {
              const dotWidth = interpolate(
                scrollX.value,
                [(i - 1) * width, i * width, (i + 1) * width],
                [8, 20, 8],
                Extrapolate.CLAMP
              );
              const opacity = interpolate(
                scrollX.value,
                [(i - 1) * width, i * width, (i + 1) * width],
                [0.4, 1, 0.4],
                Extrapolate.CLAMP
              );
              return {
                width: dotWidth,
                opacity,
              };
            });
            return <Animated.View key={i} style={[styles.dot, animatedDotStyle]} />;
          })}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8} disabled={isTransitioning}>
          <Text style={styles.nextButtonText}>
            {currentIndex === STEPS.length - 1 ? 'GET STARTED' : 'CONTINUE'}
          </Text>
          <IconSymbol name="chevron.right" size={18} color={Palette.background} />
        </TouchableOpacity>

        {currentIndex < STEPS.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleFinish}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {isTransitioning && (
        <View style={styles.transitionOverlay}>
          <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFill} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.primary,
  },
  stepContainer: {
    width,
    height,
    justifyContent: 'space-between',
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 140, // Responsive offset from footer space
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    zIndex: 2,
  },
  title: {
    ...Typography.onboardingTitle,
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.onboardingSubtitle,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    zIndex: 3,
    backgroundColor: 'transparent',
  },
  paginationContainer: {
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.background,
  },
  nextButton: {
    backgroundColor: Palette.primary,
    flexDirection: 'row',
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.premium,
  },
  nextButtonText: {
    color: Palette.background,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3,
  },
  skipButton: {
    marginTop: Spacing.lg,
    alignSelf: 'center',
  },
  skipText: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    fontSize: 10,
  },
  archiveVisual: {
    width: '100%',
    height: height * 0.55, // Responsive height
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  floatingCard: {
    width: Math.min(180, width * 0.35),
    position: 'absolute',
    ...Shadows.premium,
  },
  captureVisual: {
    width: '100%',
    height: height * 0.55, // Responsive height
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mainTicket: {
    width: Math.min(width * 0.85, 380),
    maxWidth: '90%',
    ...Shadows.premium,
  },
  cameraCircle: {
    position: 'absolute',
    bottom: Math.max(0, height * 0.08),
    right: Math.max(20, width * 0.05),
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Palette.paper,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.premium,
    zIndex: 20,
  },
  keepsakeVisual: {
    width: '100%',
    height: height * 0.55, // Responsive height
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ticketStack: {
    width: Math.min(width * 0.9, 340),
    height: Math.min(height * 0.45, 280),
    justifyContent: 'center',
    alignItems: 'center',
  },
  stackItem: {
    position: 'absolute',
    width: '85%',
    height: '70%',
    backgroundColor: 'white',
    padding: Spacing.md,
    ...Shadows.soft,
    borderRadius: 16,
  },
  polaroid: {
    flex: 1,
    backgroundColor: '#eee',
  },
  topTicket: {
    width: '100%',
    maxHeight: 220,
    ...Shadows.premium,
    zIndex: 50,
  },
  transitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});

export default OnboardingScreen;
