import React, { useState, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const LIST_CANVAS_WIDTH = width - Theme.spacing.xl * 2;
const GRID_CANVAS_WIDTH = (width - Theme.spacing.xl * 2 - Theme.spacing.md) / 2;

const PUNCH_RADIUS = 10;
const PUNCH_GAP = 3;
const SERIAL_BARS = 24;

interface TicketCanvasProps {
  id?: string;
  imageUri?: string;
  title: string;
  date: string;
  location: string;
  note?: string;
  category?: string;
  design?: 'postal' | 'instant';
  accentColor?: string;
  side?: 'front' | 'back';
  isExporting?: boolean;
  variant?: 'list' | 'grid';
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

const FadeInImage = ({ uri, style }: { uri: string; style: any }) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  return (
    <>
      {!loaded && !errored && <View style={[style, { backgroundColor: Theme.colors.skeleton }]} />}
      {errored ? (
        <View style={[style, { backgroundColor: Theme.colors.border, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="image-outline" size={24} color={Theme.colors.inkMuted} style={{ opacity: 0.3 }} />
        </View>
      ) : (
        <AnimatedImage
          source={{ uri }}
          style={[style, { position: loaded ? 'relative' : 'absolute' }]}
          entering={FadeIn.duration(600)}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          resizeMode="cover"
        />
      )}
    </>
  );
};

const ScallopedEdges = ({ canvasWidth }: { canvasWidth: number }) => {
  const horizontalCount = Math.floor(canvasWidth / (PUNCH_RADIUS * 2 + PUNCH_GAP));
  return (
    <>
      <View style={styles.edgeRowTop}>
        {[...Array(horizontalCount)].map((_, i) => (
          <View key={`top-${i}`} style={styles.scallopShadow}>
            <View style={styles.scallopPunch} />
          </View>
        ))}
      </View>
      <View style={styles.edgeRowBottom}>
        {[...Array(horizontalCount)].map((_, i) => (
          <View key={`bottom-${i}`} style={styles.scallopShadow}>
            <View style={styles.scallopPunch} />
          </View>
        ))}
      </View>
    </>
  );
};

const SidePerforations = () => (
  <>
    <View style={styles.sidePerfLeft} />
    <View style={styles.sidePerfRight} />
  </>
);

const Barcode = ({ accentColor }: { accentColor: string }) => (
  <View style={styles.barcodeContainer}>
    {[...Array(SERIAL_BARS)].map((_, i) => (
      <View
        key={i}
        style={[
          styles.barcodeBar,
          {
            width: 1 + (i % 3),
            height: 14 + (i % 4) * 3,
            backgroundColor: accentColor,
            opacity: 0.2 + (i % 4) * 0.08,
          },
        ]}
      />
    ))}
  </View>
);

const GrainTexture = () => {
  const dots = useMemo(() => {
    const result: React.ReactNode[] = [];
    for (let r = 0; r < 40; r++) {
      for (let c = 0; c < 20; c++) {
        const opacity = 0.008 + ((r * 7 + c * 13) % 9) * 0.004;
        if (opacity > 0.012) {
          result.push(
            <View
              key={`g-${r}-${c}`}
              style={{
                position: 'absolute',
                top: r * 12 + (c % 4),
                left: c * 12 + (r % 3),
                width: 1,
                height: 1,
                borderRadius: 0.5,
                backgroundColor: Theme.colors.ink,
                opacity,
              }}
            />
          );
        }
      }
    }
    return result;
  }, []);

  return (
    <View style={styles.grainLayer} pointerEvents="none" collapsable={false}>
      {dots}
    </View>
  );
};

const ImageGradient = () => (
  <LinearGradient
    colors={['transparent', Theme.colors.card]}
    locations={[0.25, 1]}
    style={styles.imageGradient}
    pointerEvents="none"
  />
);

export const TicketCanvas: React.FC<TicketCanvasProps> = ({
  design = 'postal',
  accentColor = '#D9C5B2',
  variant = 'list',
  id,
  imageUri,
  title,
  date,
  location,
  note,
  category,
  side = 'front',
  isExporting = false,
}) => {
  const isPostal = design === 'postal';
  const isGrid = variant === 'grid';
  const canvasWidth = isGrid ? GRID_CANVAS_WIDTH : LIST_CANVAS_WIDTH;
  const stampRotation = useRef(`${(Math.random() * 10 - 5).toFixed(1)}deg`).current;

  const paperShadow = !isExporting
    ? {
        shadowColor: '#4A3728',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
      }
    : {};

  const containerStyle = [
    styles.artifact,
    isPostal ? styles.postalContainer : styles.instantContainer,
    paperShadow,
    {
      width: canvasWidth,
      backgroundColor: Theme.colors.card,
      borderColor: Theme.colors.border,
      minHeight: isGrid ? 260 : 500,
    },
  ];

  const renderFront = () => (
    <View style={{ flex: 1 }}>
      {/* Photo Section */}
      <View style={styles.photoSection}>
        {imageUri ? (
          <>
            <FadeInImage uri={imageUri} style={styles.photo} />
            <ImageGradient />
          </>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="image-outline" size={48} color={`${accentColor}20`} />
          </View>
        )}
        {category && (
          <View style={styles.categoryChip}>
            <Text style={styles.categoryLabel}>{category.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <Text style={styles.ticketTitle}>{title || 'UNTITLED'}</Text>
        {note ? (
          <Text style={styles.ticketNote}>
            {'\u201C'}{note}{'\u201D'}
          </Text>
        ) : null}

        {/* Metadata Grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>DATE</Text>
            <Text style={styles.metaValue}>{date || '—'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>LOCATION</Text>
            <View style={styles.metaValueRow}>
              <Ionicons name="location-outline" size={12} color={Theme.colors.ink} style={{ opacity: 0.5 }} />
              <Text style={styles.metaValue}>{location || '—'}</Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>TICKET ID</Text>
            <Text style={[styles.metaValue, styles.metaMono]}>
              #{id?.substring(0, 8).toUpperCase() || 'ARCH-0000'}
            </Text>
          </View>
        </View>
      </View>

      {/* Dashed Divider with Side Perforations */}
      <View style={styles.dividerSection}>
        <SidePerforations />
        <View style={styles.dashedLine} />
      </View>

      {/* Bottom Stub */}
      <View style={styles.stubSection}>
        <View style={[styles.stampBox, { borderColor: `${accentColor}40`, transform: [{ rotate: stampRotation }] }]}>
          <Text style={[styles.stampLabel, { color: accentColor }]}>VERIFIED</Text>
        </View>
        <Barcode accentColor={accentColor} />
      </View>
    </View>
  );

  const renderBack = () => (
    <View style={styles.backContainer}>
      <Text style={styles.backLabel}>ARCHIVAL REGISTRY</Text>
      <View style={styles.backNoteBody}>
        <Text style={styles.handwrittenText}>
          {note || 'No additional reflections recorded.'}
        </Text>
      </View>
      <Text style={styles.backSerial}>
        #{id?.substring(0, 8).toUpperCase() || 'ARCH-0000'}
      </Text>
    </View>
  );

  return (
    <View style={containerStyle}>
      {isPostal && <ScallopedEdges canvasWidth={canvasWidth} />}
      {side === 'front' ? renderFront() : renderBack()}
      <GrainTexture />
    </View>
  );
};

const styles = StyleSheet.create({
  artifact: {
    overflow: 'hidden',
  },
  postalContainer: {
    borderWidth: 1,
    borderRadius: Theme.borderRadius.card,
  },
  instantContainer: {
    borderWidth: 1.5,
    borderRadius: Theme.borderRadius.card,
  },

  /* Scalloped Edges */
  edgeRowTop: {
    position: 'absolute',
    top: -PUNCH_RADIUS,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    zIndex: 10,
  },
  edgeRowBottom: {
    position: 'absolute',
    bottom: -PUNCH_RADIUS,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    zIndex: 10,
  },
  scallopShadow: {
    width: PUNCH_RADIUS * 2 + 1,
    height: PUNCH_RADIUS * 2 + 1,
    borderRadius: (PUNCH_RADIUS * 2 + 1) / 2,
    backgroundColor: Theme.colors.inkMuted,
    opacity: 0.06,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scallopPunch: {
    width: PUNCH_RADIUS * 2,
    height: PUNCH_RADIUS * 2,
    borderRadius: PUNCH_RADIUS,
    backgroundColor: Theme.colors.background,
  },

  /* Side Perforations */
  sidePerfLeft: {
    position: 'absolute',
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    zIndex: 10,
  },
  sidePerfRight: {
    position: 'absolute',
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    zIndex: 10,
  },

  /* Photo Section */
  photoSection: {
    width: '100%',
    height: 280,
    backgroundColor: Theme.colors.skeleton,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  categoryChip: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: Theme.colors.glass,
    borderRadius: Theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  categoryLabel: {
    ...Theme.typography.label,
    fontSize: 9,
    color: Theme.colors.accent,
    letterSpacing: 1.2,
    fontWeight: '700',
  },

  /* Content Section */
  contentSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  ticketTitle: {
    ...Theme.typography.display,
    fontSize: 26,
    color: Theme.colors.ink,
    marginBottom: 14,
    letterSpacing: -0.4,
  },
  ticketNote: {
    ...Theme.typography.note,
    fontSize: 15,
    lineHeight: 26,
    color: `${Theme.colors.ink}99`,
    marginBottom: 24,
    paddingLeft: 4,
  },

  /* Metadata Grid */
  metaGrid: {
    gap: 12,
  },
  metaItem: {
    gap: 2,
  },
  metaLabel: {
    ...Theme.typography.label,
    fontSize: 8,
    color: Theme.colors.inkMuted,
    opacity: 0.5,
    letterSpacing: 1.5,
  },
  metaValue: {
    ...Theme.typography.body,
    fontSize: 13,
    color: `${Theme.colors.ink}CC`,
  },
  metaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaMono: {
    ...Theme.typography.monoSmall,
    fontSize: 11,
    letterSpacing: 0.5,
  },

  /* Divider */
  dividerSection: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.inkMuted,
    borderStyle: 'dashed',
    opacity: 0.35,
  },

  /* Bottom Stub */
  stubSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  stampBox: {
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sharp,
    opacity: 0.7,
  },
  stampLabel: {
    ...Theme.typography.label,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
    opacity: 0.4,
  },
  barcodeBar: {
    borderRadius: 1,
  },

  /* Back Side */
  backContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: {
    ...Theme.typography.label,
    fontSize: 10,
    letterSpacing: 4,
    opacity: 0.5,
    marginBottom: 40,
    color: Theme.colors.ink,
  },
  backNoteBody: {
    flex: 1,
    justifyContent: 'center',
  },
  handwrittenText: {
    ...Theme.typography.note,
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'center',
    color: `${Theme.colors.ink}70`,
  },
  backSerial: {
    ...Theme.typography.monoSmall,
    opacity: 0.2,
    marginTop: 24,
    letterSpacing: 1,
    color: Theme.colors.ink,
  },

  /* Grain */
  grainLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
});
