import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { ScreenContainer, IconButton } from '@/components/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Theme } from '@/theme';
import { TicketCanvas } from '@/components/TicketCanvas';
import { storage } from '@/utils/storage';
import { Ticket } from '@/types';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useToast } from '@/components/Toast';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const UNDO_TIMEOUT = 6000;

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [designVariant, setDesignVariant] = useState<'postal' | 'instant'>('postal');
  const [accentColor, setAccentColor] = useState('#D9C5B2');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const [tickets, variant, color] = await Promise.all([
        storage.getTickets(),
        storage.getDesignVariant(),
        storage.getAccentColor(),
      ]);
      setDesignVariant(variant);
      setAccentColor(color);

      const found = tickets.find(t => t.id === id);
      if (found) {
        if (mountedRef.current) setTicket(found);
      } else {
        showToast('Could not find this memory', 'error');
        setTimeout(() => { if (mountedRef.current) router.back(); }, 600);
      }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const handleEdit = () => {
    if (!ticket) return;
    setMenuVisible(false);
    router.push({
      pathname: '/editor',
      params: {
        editId: ticket.id,
        initialTitle: ticket.title,
        initialLocation: ticket.location,
        initialDate: ticket.date,
        initialNote: ticket.note,
        initialCategory: ticket.category,
        initialImageUri: ticket.photoUri,
      },
    });
  };

  const captureImage = async (): Promise<string | null> => {
    if (!viewShotRef.current?.capture) return null;
    try {
      return await viewShotRef.current.capture();
    } catch {
      showToast('Could not capture image', 'error');
      return null;
    }
  };

  const handleSaveToGallery = async () => {
    setMenuVisible(false);
    setIsExporting(true);
    setTimeout(async () => {
      const uri = await captureImage();
      if (uri) {
        try {
          await MediaLibrary.saveToLibraryAsync(uri);
          showToast('Saved to your gallery');
        } catch {
          showToast('Could not access gallery', 'warning');
        }
      }
      setIsExporting(false);
    }, 400);
  };

  const handleShare = async () => {
    setMenuVisible(false);
    setIsExporting(true);
    setTimeout(async () => {
      const uri = await captureImage();
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share this memory',
          UTI: 'public.png',
        });
      }
      setIsExporting(false);
    }, 400);
  };

  const handleDeleteConfirm = () => {
    setMenuVisible(false);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!ticket || deleting) return;
    setDeleting(true);
    setShowDeleteConfirm(false);

    const saved = await storage.softDeleteTicket(ticket.id);
    if (!saved) {
      showToast('Could not delete', 'error');
      setDeleting(false);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    showToast({
      message: 'Memory removed',
      type: 'undo',
      duration: UNDO_TIMEOUT,
      haptic: false,
      action: {
        label: 'UNDO',
        onPress: async () => {
          if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
          const restored = await storage.undoDelete(ticket.id);
          if (restored) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTicket(saved);
            showToast('Memory restored');
          }
        },
      },
    });

    router.back();
    setDeleting(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  if (!ticket) return null;

  return (
    <ScreenContainer edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {!isExporting && (
        <Animated.View entering={FadeIn.duration(300)} style={[styles.header, { top: insets.top + 4 }]}>
          <IconButton name="arrow-back" size={22} color={Theme.colors.ink} style={{ opacity: 0.5 }} onPress={() => router.back()} />
          <IconButton name="ellipsis-horizontal" size={22} color={Theme.colors.ink} style={{ opacity: 0.5 }} onPress={() => setMenuVisible(true)} />
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainArea}>
          <Animated.View entering={FadeInDown.springify().damping(30).stiffness(100)}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}
              style={styles.exportArea}
            >
              <TicketCanvas
                id={ticket.id}
                imageUri={ticket.photoUri}
                title={ticket.title}
                location={ticket.location}
                date={ticket.date}
                note={ticket.note}
                category={ticket.category}
                design={designVariant}
                accentColor={accentColor}
                side="front"
                isExporting={isExporting}
              />
            </ViewShot>
          </Animated.View>
        </View>
      </ScrollView>

      {isExporting && (
        <View style={styles.exportRow}>
          <ActivityIndicator size="small" color={accentColor} />
          <Text style={styles.exportText}>Preparing export...</Text>
        </View>
      )}

      {!isExporting && (
        <Animated.View entering={FadeInDown.delay(400).springify().damping(30).stiffness(100)} style={styles.footer}>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionCircle} onPress={handleShare} activeOpacity={0.7}>
              <View style={[styles.actionIconWrap, { backgroundColor: accentColor }]}>
                <Ionicons name="share-outline" size={18} color={Theme.colors.white} />
              </View>
              <Text style={styles.actionLabel}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCircle} onPress={handleSaveToGallery} activeOpacity={0.7}>
              <View style={[styles.actionIconWrap, styles.actionIconWrapSecondary]}>
                <Ionicons name="download-outline" size={18} color={Theme.colors.ink} />
              </View>
              <Text style={styles.actionLabel}>Save</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
            <Animated.View entering={FadeInDown.springify().damping(32).stiffness(90)}>
              <View style={styles.sheet}>
                <View style={styles.sheetHandle} />
                <TouchableOpacity style={styles.sheetRow} onPress={handleEdit}>
                  <Ionicons name="create-outline" size={20} color={Theme.colors.ink} style={{ opacity: 0.7 }} />
                  <Text style={styles.sheetRowText}>Edit Memory</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetRow} onPress={handleSaveToGallery}>
                  <Ionicons name="image-outline" size={20} color={Theme.colors.ink} style={{ opacity: 0.7 }} />
                  <Text style={styles.sheetRowText}>Save as Image</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetRow} onPress={handleShare}>
                  <Ionicons name="share-social-outline" size={20} color={Theme.colors.ink} style={{ opacity: 0.7 }} />
                  <Text style={styles.sheetRowText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sheetRow, { borderBottomWidth: 0 }]} onPress={handleDeleteConfirm}>
                  <Ionicons name="trash-outline" size={20} color={Theme.colors.danger} />
                  <Text style={[styles.sheetRowText, { color: Theme.colors.danger }]}>Delete Memory</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Pressable>
        </View>
      </Modal>

      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <Pressable style={styles.confirmOverlay} onPress={cancelDelete}>
          <Animated.View entering={FadeInDown.springify().damping(30).stiffness(90)}>
            <View style={styles.confirmCard} onStartShouldSetResponder={() => true}>
              <View style={[styles.confirmIconWrap, { backgroundColor: Theme.colors.danger + '18' }]}>
                <Ionicons name="archive-outline" size={28} color={Theme.colors.danger} />
              </View>
              <Text style={styles.confirmTitle}>Remove this memory?</Text>
              <Text style={styles.confirmText}>
                It will be moved to a safe place for a few seconds in case you change your mind.
              </Text>
              <View style={styles.confirmActions}>
                <TouchableOpacity style={styles.confirmCancelBtn} onPress={cancelDelete} activeOpacity={0.7}>
                  <Text style={styles.confirmCancelText}>Keep it</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmDeleteBtn} onPress={executeDelete} activeOpacity={0.7}>
                  <Text style={styles.confirmDeleteText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.colors.background },

  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.xl,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 100,
  },
  mainArea: {
    alignItems: 'center',
  },

  exportArea: {
    alignItems: 'center',
  },

  footer: {
    paddingBottom: 40,
    paddingTop: Theme.spacing.xl,
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  actionCircle: {
    alignItems: 'center',
    gap: 8,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconWrapSecondary: {
    backgroundColor: Theme.colors.glass,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  actionLabel: {
    ...Theme.typography.caption,
    fontSize: 11,
    color: Theme.colors.inkMuted,
    letterSpacing: 0.5,
  },
  exportRow: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exportText: {
    ...Theme.typography.label,
    fontSize: 10,
    color: Theme.colors.inkMuted,
    letterSpacing: 1,
  },

  overlay: { flex: 1, backgroundColor: Theme.colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.container,
    borderTopRightRadius: Theme.borderRadius.container,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: 12,
    paddingBottom: 48,
  },
  sheetHandle: {
    width: 32,
    height: 4,
    borderRadius: Theme.borderRadius.pill,
    backgroundColor: Theme.colors.border,
    alignSelf: 'center',
    marginBottom: 24,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
    gap: 16,
  },
  sheetRowText: {
    ...Theme.typography.body,
    fontSize: 15,
    color: Theme.colors.ink,
    letterSpacing: 0.3,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: Theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  confirmCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.container,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 12,
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  confirmTitle: {
    ...Theme.typography.displaySmall,
    fontSize: 18,
    color: Theme.colors.ink,
    textAlign: 'center',
  },
  confirmText: {
    ...Theme.typography.body,
    fontSize: 14,
    color: Theme.colors.inkMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: Theme.borderRadius.container,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
  },
  confirmCancelText: {
    ...Theme.typography.body,
    fontSize: 14,
    color: Theme.colors.ink,
  },
  confirmDeleteBtn: {
    flex: 1,
    height: 50,
    borderRadius: Theme.borderRadius.container,
    backgroundColor: Theme.colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDeleteText: {
    ...Theme.typography.label,
    fontSize: 12,
    color: Theme.colors.white,
    letterSpacing: 1,
  },
});
