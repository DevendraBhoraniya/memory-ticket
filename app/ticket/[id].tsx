import MemoryTicket from '@/components/MemoryTicket';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import PermissionModal from '@/components/ui/PermissionModal';
import { Palette, Shadows, Spacing, Typography } from '@/constants/theme';
import { usePermissionGate } from '@/hooks/use-permissions';
import { useTickets } from '@/hooks/use-tickets';
import { Ticket } from '@/types';
import { useTicketExport } from '@/utils/export';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../_layout';

const { width } = Dimensions.get('window');

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { deleteTicket, tickets, loading: ticketsLoading } = useTickets();
  const { gate, closeGate, checkGalleryPermission, confirmPermission } = usePermissionGate();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isExportEngineMounted, setIsExportEngineMounted] = useState(false);

  // 1. 3D Flip State & Animation
  const rotate = useSharedValue(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotate.value}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotate.value + 180}deg` }],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }));

  const toggleFlip = () => {
    Haptics.selectionAsync();
    const target = isFlipped ? 0 : 180;
    rotate.value = withSpring(target, { damping: 15, stiffness: 90 });
    setIsFlipped(!isFlipped);
  };

  const { ticketRef, shareTicketImage, saveTicketImage } = useTicketExport();

  useEffect(() => {
    if (!ticketsLoading) {
      const found = tickets.find((t) => t.id === id);
      if (found) {
        setTicket(found);
        setLoading(false);
      } else if (tickets.length > 0) {
        showToast('Memory not found', 'error');
        router.back();
      }
    }
  }, [tickets, ticketsLoading, id]);

  const confirmDelete = async () => {
    if (id) {
      try {
        await deleteTicket(id);
        setShowDeleteModal(false);
        showToast('Memory removed');
        router.replace('/');
      } catch (e) {
        showToast('Failed to remove memory', 'error');
      }
    }
  };

  const handleEdit = () => {
    Haptics.selectionAsync();
    router.push({
      pathname: '/create-ticket',
      params: { ticketId: id }
    });
  };

  const handleShare = async () => {
    if (exporting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);
    setIsExportEngineMounted(true);
    
    // Wait for the hidden component to layout and image to decode
    setTimeout(async () => {
      try {
        await shareTicketImage();
      } catch (error: any) {
        showToast(error.message, 'error');
      } finally {
        setExporting(false);
        setIsExportEngineMounted(false);
      }
    }, 500);
  };

  const handleSaveToGallery = async () => {
    if (exporting) return;
    checkGalleryPermission(async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setExporting(true);
      setIsExportEngineMounted(true);
      
      // Wait for the hidden component to layout and image to decode
      setTimeout(async () => {
        try {
          await saveTicketImage();
          showToast('Preserved to gallery');
        } catch (error: any) {
          showToast(error.message, 'error');
        } finally {
          setExporting(false);
          setIsExportEngineMounted(false);
        }
      }, 500);
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Palette.secondary} />
      </View>
    );
  }

  if (!ticket) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Refined Header (Matches Create Screen) */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <IconSymbol name="plus" size={24} color={Palette.primary} style={{ transform: [{ rotate: '45deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MEMORABLE STUB</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.headerBtn}>
          <Text style={styles.editAction}>EDIT</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Cinematic Ticket Focus with 3D Flip */}
        <Animated.View entering={FadeIn.duration(800)} style={styles.previewSection}>
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={toggleFlip}
            style={styles.ticketWrapper}
          >
            <View style={styles.flipContainer}>
              <Animated.View style={frontAnimatedStyle}>
                <MemoryTicket ticket={ticket} variant="detail" side="front" />
              </Animated.View>
              <Animated.View style={backAnimatedStyle}>
                <MemoryTicket ticket={ticket} variant="detail" side="back" />
              </Animated.View>
            </View>
          </TouchableOpacity>
          
          <Animated.View entering={FadeIn.delay(1000)} style={styles.hintContainer}>
             <Text style={styles.hintText}>TAP TO FLIP</Text>
          </Animated.View>
        </Animated.View>

        {/* Narrative Section (Matches Create Form) */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.contentSection}>
          <View style={styles.textGroup}>
            <Text style={styles.label}>THE TITLE</Text>
            <Text style={styles.titleText}>{ticket.title}</Text>
          </View>

          {ticket.note && (
            <View style={styles.textGroup}>
              <Text style={styles.label}>THE REFLECTION</Text>
              <Text style={styles.noteText}>{ticket.note}</Text>
            </View>
          )}

          {/* Metadata Grid (Matches Create Metadata) */}
          <View style={styles.metadataGrid}>
            <View style={styles.metaField}>
              <Text style={styles.label}>LOCATION</Text>
              <Text style={styles.metaValue}>{ticket.location || 'Somewhere'}</Text>
            </View>
            <View style={styles.metaField}>
              <Text style={styles.label}>DATE</Text>
              <Text style={styles.metaValue}>{ticket.date}</Text>
            </View>
          </View>

          {/* Action Row (Polished & Restrained) */}
          <View style={styles.actionRow}>
            <ActionButton 
              icon="square.and.arrow.up" 
              label="SHARE" 
              onPress={handleShare}
              disabled={exporting}
            />
            <View style={styles.actionDivider} />
            <ActionButton 
              icon="arrow.down.to.line" 
              label="SAVE" 
              onPress={handleSaveToGallery}
              disabled={exporting}
            />
            <View style={styles.actionDivider} />
            <ActionButton 
              icon="trash" 
              label="DELETE" 
              onPress={() => setShowDeleteModal(true)}
              danger
              disabled={exporting}
            />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Hidden Export Engine (Lazy Mounted) */}
      {isExportEngineMounted && (
        <View style={styles.offscreen} pointerEvents="none">
          <View ref={ticketRef} collapsable={false}>
            <MemoryTicket ticket={ticket} variant="export" />
          </View>
        </View>
      )}

      {exporting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Palette.background} />
          <Text style={styles.loadingText}>PREPARING STUB</Text>
        </View>
      )}

      <ConfirmModal
        visible={showDeleteModal}
        title="Remove Memory"
        message="This will permanently remove this stub from your collection."
        confirmText="DELETE"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        danger
      />

      <PermissionModal
        visible={gate.visible}
        type={gate.kind}
        isPermanentlyDenied={gate.isPermanentlyDenied}
        title={gate.kind === 'photos' ? "Access Photos" : "Save to Gallery"}
        message={gate.isPermanentlyDenied 
          ? "Permission was previously denied. Please enable it in your device settings to continue."
          : "We need access to your library to select and preserve your memories."
        }
        onConfirm={confirmPermission}
        onCancel={closeGate}
      />
    </View>
  );
}

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress, danger, disabled }) => (
  <TouchableOpacity 
    onPress={onPress}
    activeOpacity={0.7}
    disabled={disabled}
    style={styles.actionBtn}
  >
    <IconSymbol 
      name={icon as any} 
      size={18} 
      color={danger ? '#FF453A' : Palette.primary} 
      style={{ opacity: disabled ? 0.3 : 1 }}
    />
    <Text style={[styles.actionLabel, danger && styles.dangerLabel, disabled && styles.disabledLabel]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Palette.background,
    zIndex: 10,
    minHeight: 60,
  },
  headerTitle: {
    ...Typography.headerTitleSmall,
  },
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAction: {
    ...Typography.label,
    fontSize: 12,
    color: Palette.primary,
    fontWeight: '800',
    letterSpacing: 2,
  },
  scrollContent: {
    paddingBottom: 100,
    minHeight: '100%',
  },
  previewSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    minHeight: 200,
    maxHeight: 500,
    justifyContent: 'center',
  },
  ticketWrapper: {
    width: '100%',
    maxWidth: 380,
  },
  flipContainer: {
    width: '100%',
    aspectRatio: undefined,
    minHeight: 300,
    ...Shadows.premium,
  },
  hintContainer: {
    marginTop: Spacing.lg,
    opacity: 0.3,
    alignItems: 'center',
  },
  hintText: {
    ...Typography.label,
    fontSize: 8,
    letterSpacing: 3,
  },
  contentSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    minHeight: 200,
  },
  textGroup: {
    marginBottom: Spacing.xl,
    minHeight: 40,
  },
  label: {
    ...Typography.label,
    fontSize: 9,
    marginBottom: Spacing.sm,
    color: Palette.secondary,
    opacity: 0.6,
  },
  titleText: {
    ...Typography.heroTitle,
    marginTop: Spacing.xs,
  },
  noteText: {
    ...Typography.formBody,
    opacity: 0.9,
    lineHeight: 26,
  },
  metadataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 213, 192, 0.5)',
    marginBottom: Spacing.xl,
    minHeight: 80,
  },
  metaField: {
    flex: 1,
  },
  metaValue: {
    ...Typography.mono,
    fontSize: 15,
    color: Palette.primary,
    marginTop: Spacing.xs,
    minHeight: 36,
    lineHeight: 24,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Palette.secondaryTransparentSubtle,
    borderRadius: 24,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    minHeight: 60,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  actionLabel: {
    ...Typography.label,
    fontSize: 10,
    letterSpacing: 1,
    color: Palette.primary,
  },
  dangerLabel: {
    color: '#FF453A',
  },
  disabledLabel: {
    opacity: 0.3,
  },
  actionDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(123, 94, 67, 0.1)',
  },
  offscreen: {
    position: 'absolute',
    left: -3000,
    width: 380,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    ...Typography.label,
    color: Palette.background,
    marginTop: Spacing.lg,
    letterSpacing: 4,
    fontSize: 12,
  },
});
