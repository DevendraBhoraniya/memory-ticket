import { StyleSheet, Text, View, Dimensions, TouchableOpacity, Pressable, StatusBar } from 'react-native';
import { useOnboarding } from './_layout';
import { Theme } from '@/theme';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  interpolate, 
  Extrapolate, 
  SharedValue, 
  withSpring,
  useAnimatedScrollHandler,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Your Stories,\nPreserved Beautifully',
    description: 'Every meaningful moment deserves to be kept. Turn your photos into elegant keepsakes that feel as special as the memory itself.',
    image: require('../assets/images/onboarding/onboarding-travel.png'),
  },
  {
    id: '2',
    title: 'The Details\nMake It Real',
    description: 'Where were you? When did it happen? What made it unforgettable? Every ticket captures the full story behind the moment.',
    image: require('../assets/images/onboarding/onboarding-nostalgic.png'),
  },
  {
    id: '3',
    title: 'Your Collection\nAwaits',
    description: 'Start building a beautiful timeline of your life. Each ticket is a doorway back to a moment you never want to forget.',
    image: require('../assets/images/onboarding/onboarding-night.png'),
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface DotProps {
  index: number;
  scrollX: SharedValue<number>;
}

const PaginationDot = ({ index, scrollX }: DotProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1.4, 0.8],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.2, 1, 0.2],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={styles.dotContainer}>
      <Animated.View style={[styles.dot, animatedStyle]} />
    </View>
  );
};

interface SlideProps {
  item: typeof SLIDES[0];
  index: number;
  scrollX: SharedValue<number>;
}

const Slide = ({ item, index, scrollX }: SlideProps) => {
  const imageAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [1.1, 1, 1.1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.slide}>
      <Animated.Image 
        source={item.image}
        style={[styles.image, imageAnimatedStyle]} 
        resizeMode="cover"
      />
      <View style={styles.gradientOverlay} />
      
      <View style={styles.content}>
        {index === 0 ? (
          <>
            <Animated.Text entering={FadeInDown.delay(200).duration(600).springify()} style={styles.title}>
              {item.title}
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(400).duration(600).springify()} style={styles.description}>
              {item.description}
            </Animated.Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </>
        )}
      </View>
    </View>
  );
};

export default function OnboardingScreen() {
  const { completeOnboarding } = useOnboarding();
  const scrollX = useSharedValue(0);
  const btnScale = useSharedValue(1);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, index) => (
          <Slide key={slide.id} item={slide} index={index} scrollX={scrollX} />
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => (
            <PaginationDot key={i} index={i} scrollX={scrollX} />
          ))}
        </View>

        <AnimatedPressable 
          style={[styles.button, { transform: [{ scale: btnScale.value }] }]} 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); completeOnboarding(); }}
          onPressIn={() => btnScale.value = withSpring(0.96)}
          onPressOut={() => btnScale.value = withSpring(1)}
        >
          <Text style={styles.buttonText}>BEGIN YOUR COLLECTION</Text>
          <Ionicons name="arrow-forward" size={18} color={Theme.colors.black} />
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.detailBg,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'flex-end',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Theme.colors.overlay,
  },
  content: {
    padding: Theme.spacing.xl,
    paddingBottom: SCREEN_HEIGHT * 0.25,
    gap: 12,
  },
  title: {
    ...Theme.typography.displayLarge,
    fontSize: 34,
    letterSpacing: 0.5,
    color: Theme.colors.white,
    lineHeight: 42,
  },
  description: {
    ...Theme.typography.body,
    fontSize: 16,
    color: Theme.colors.white,
    lineHeight: 26,
    maxWidth: '90%',
    opacity: 0.75,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Theme.spacing.xl,
    paddingBottom: 60,
    gap: 32,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  dotContainer: {
    width: 8,
    height: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.white,
  },
  button: {
    backgroundColor: Theme.colors.white,
    height: 56,
    borderRadius: Theme.borderRadius.pill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    ...Theme.typography.label,
    color: Theme.colors.black,
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: '800',
  },
});
