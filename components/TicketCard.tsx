import { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Pressable, View, Dimensions, Text, Image } from 'react-native';
import { Theme } from '@/theme';
import { Ticket } from '@/types';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const AnimatedImage = Animated.createAnimatedComponent(Image);

const { width } = Dimensions.get('window');
const GRID_GAP = Theme.spacing.md;
const GRID_PAD = Theme.spacing.xl;
const GRID_SIZE = (width - GRID_PAD * 2 - GRID_GAP) / 2;

const ROTATIONS = [-3.2, 2.8, -2.4, 3.0, -1.8, 2.5, -2.0, 3.5];
const Y_OFFSETS = [-2, 5, -3, 7, -1, 4, -5, 2];

const PHOTO_ASPECT = 1;
const CAPTION_HEIGHT = 56;

interface TicketCardProps {
  ticket: Ticket;
  index: number;
  onPress: () => void;
  variant?: 'list' | 'grid';
  design?: 'postal' | 'instant';
  accentColor?: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  index,
  onPress,
  variant = 'list',
  design = 'postal',
  accentColor,
}) => {
  const scale = useSharedValue(1);
  const rotateAdjust = useSharedValue(0);
  const isGrid = variant === 'grid';
  const isPostal = design === 'postal';
  const baseRotation = ROTATIONS[index % ROTATIONS.length];
  const yOffset = Y_OFFSETS[index % Y_OFFSETS.length];
  const [errored, setErrored] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${baseRotation + rotateAdjust.value}deg` },
    ],
  }));

  const perfDots = useMemo(() => {
    const dots: React.ReactNode[] = [];
    for (let i = 0; i < 14; i++) {
      dots.push(<View key={`pd-${i}`} style={styles.perfDot} />);
    }
    return dots;
  }, []);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.94, { damping: 22, stiffness: 160 });
    if (isGrid) {
      rotateAdjust.value = withSpring(-baseRotation * 0.4, { damping: 24, stiffness: 120 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 160 });
    if (isGrid) {
      rotateAdjust.value = withSpring(0, { damping: 26, stiffness: 100 });
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 90).springify().damping(30).stiffness(120)}
      style={[isGrid ? styles.gridOuter : styles.listOuter, isGrid && { marginTop: yOffset }]}
    >
      <Animated.View style={[styles.card, isPostal ? styles.cardPostal : styles.cardInstant, animatedStyle]}>
        {isPostal && <View style={styles.perfRowTop}>{perfDots}</View>}
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.pressable}
        >
          <View style={styles.photoWrap}>
            {errored ? (
              <View style={styles.photoFallback}>
                <Ionicons name="image-outline" size={24} color={Theme.colors.inkMuted} style={{ opacity: 0.3 }} />
              </View>
            ) : (
              <AnimatedImage
                source={{ uri: ticket.photoUri }}
                style={styles.photo}
                entering={FadeIn.duration(600)}
                resizeMode="cover"
                onError={() => setErrored(true)}
              />
            )}
          </View>
          <View style={styles.caption}>
            <Text style={[styles.captionTitle, accentColor && { color: accentColor }]} numberOfLines={1}>
              {ticket.title}
            </Text>
            <Text style={styles.captionDate} numberOfLines={1}>
              {ticket.date || ''}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

export const TicketCardSkeleton = ({ index, variant = 'grid' }: { index: number; variant?: 'list' | 'grid' }) => {
  const isGrid = variant === 'grid';
  const rotation = ROTATIONS[index % ROTATIONS.length];
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 90).springify().damping(30).stiffness(120)}
      style={isGrid ? styles.gridOuter : styles.listOuter}
    >
      <View style={[styles.skeletonCard, isGrid && { transform: [{ rotate: `${rotation}deg` }] }]}>
        <Animated.View style={[styles.skeletonInner, animatedOpacity]}>
          <View style={styles.skelPhoto} />
          <View style={styles.skelCaption}>
            <View style={styles.skelLine} />
            <View style={[styles.skelLine, styles.skelLineShort]} />
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gridOuter: {
    width: GRID_SIZE,
    marginBottom: Theme.spacing.lg,
  },
  listOuter: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.soft,
    overflow: 'hidden',
    shadowColor: '#4A3728',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardPostal: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardInstant: {
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  perfRowTop: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    zIndex: 10,
    paddingHorizontal: 8,
  },
  perfDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.background,
    borderWidth: 0.5,
    borderColor: Theme.colors.border,
    opacity: 0.6,
  },
  pressable: {
    width: '100%',
  },
  photoWrap: {
    width: '100%',
    aspectRatio: PHOTO_ASPECT,
    overflow: 'hidden',
    backgroundColor: Theme.colors.skeleton,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.border,
  },
  caption: {
    height: CAPTION_HEIGHT,
    paddingHorizontal: 14,
    justifyContent: 'center',
    gap: 3,
  },
  captionTitle: {
    ...Theme.typography.body,
    fontSize: 12,
    color: Theme.colors.ink,
    fontWeight: '600',
  },
  captionDate: {
    ...Theme.typography.monoSmall,
    fontSize: 8,
    color: Theme.colors.inkMuted,
    opacity: 0.5,
  },

  /* Skeleton */
  skeletonCard: {
    width: '100%',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.soft,
    overflow: 'hidden',
    shadowColor: '#4A3728',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  skeletonInner: {
    width: '100%',
  },
  skelPhoto: {
    width: '100%',
    aspectRatio: PHOTO_ASPECT,
    backgroundColor: Theme.colors.skeleton,
  },
  skelCaption: {
    height: CAPTION_HEIGHT,
    paddingHorizontal: 14,
    justifyContent: 'center',
    gap: 6,
  },
  skelLine: {
    height: 8,
    width: '70%',
    backgroundColor: Theme.colors.skeleton,
    borderRadius: 2,
  },
  skelLineShort: {
    width: '40%',
  },
});
