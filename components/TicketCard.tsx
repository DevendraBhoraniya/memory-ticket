import { Spacing } from '@/constants/theme';
import { Ticket } from '@/types';
import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    FadeInDown,
    SensorType,
    interpolate,
    useAnimatedSensor,
    useAnimatedStyle,
    withSpring
} from 'react-native-reanimated';
import MemoryTicket from './MemoryTicket';

interface TicketCardProps {
  ticket: Ticket;
  onPress: () => void;
  onLongPress?: () => void;
  index?: number;
}

const CARD_ROTATIONS = ['-1.5deg', '1.2deg', '-0.8deg', '2deg'];

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onPress, onLongPress, index = 0 }) => {
  // 1. Initialize Rotation Sensor for Parallax
  const animatedSensor = useAnimatedSensor(SensorType.ROTATION, {
    interval: 'auto',
  });

  // 2. Map sensor values to subtle tilt
  const parallaxStyle = useAnimatedStyle(() => {
    const { pitch, roll } = animatedSensor.sensor.value;
    
    // Convert radians to subtle degrees (-4deg to 4deg)
    const rotateX = interpolate(pitch, [-1.5, 1.5], [4, -4]);
    const rotateY = interpolate(roll, [-1.5, 1.5], [-4, 4]);

    return {
      transform: [
        { perspective: 1000 },
        { rotateX: withSpring(`${rotateX}deg`, { damping: 15 }) },
        { rotateY: withSpring(`${rotateY}deg`, { damping: 15 }) },
      ],
    };
  });

  // Balanced rotation for the "memory wall" feel
  const baseRotation = CARD_ROTATIONS[index % CARD_ROTATIONS.length];
  
  // Subtle vertical offset for staggered effect
  const translateY = index % 2 === 0 ? 0 : 24;

  return (
    <Animated.View 
      entering={FadeInDown.delay((index % 6) * 80).duration(600)}
      style={styles.container}
    >
      <Animated.View style={[
        { transform: [{ rotate: baseRotation }, { translateY }] },
        parallaxStyle
      ]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          onLongPress={onLongPress}
          style={styles.touchable}
        >
          <MemoryTicket 
            ticket={{
              ...ticket,
              photoUri: ticket.thumbnailUri || ticket.photoUri
            }} 
            variant="card" 
          />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
    minHeight: 200,
    maxHeight: 300,
    aspectRatio: undefined, // Let the component flow naturally
  },
  touchable: {
    width: '100%',
    height: '100%',
  },
});

export default memo(TicketCard);
