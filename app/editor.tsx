import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { ScreenContainer, HeaderBar, Card } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Theme } from '@/theme';
import { useDevice } from '@/hooks/use-device';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { storage } from '@/utils/storage';
import { saveAndOptimizeImage, deleteImageFiles } from '@/utils/files';
import { Ticket } from '@/types';
import { useToast } from '@/components/Toast';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { generateMemoryTitle } from '@/utils/memory-titles';
import DateTimePicker from '@react-native-community/datetimepicker';

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
    <View style={StyleSheet.absoluteFill} pointerEvents="none" collapsable={false}>
      {dots}
    </View>
  );
};

const NOTE_MAX = 280;

export default function EditorScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    editId?: string;
    initialTitle?: string;
    initialLocation?: string;
    initialDate?: string;
    initialNote?: string;
    initialCategory?: string;
    initialImageUri?: string;
  }>();

  const { capturePhoto, pickImage, getCurrentLocation } = useDevice();

  const [imageUri, setImageUri] = useState<string | undefined>(params.initialImageUri);
  const [title, setTitle] = useState(params.initialTitle || '');
  const [location, setLocation] = useState(params.initialLocation || '');
  const [date, setDate] = useState(params.initialDate ? new Date(params.initialDate) : new Date());
  const [note, setNote] = useState(params.initialNote || '');
  const [category, setCategory] = useState(params.initialCategory || 'Travel');
  const [designVariant, setDesignVariant] = useState<'postal' | 'instant'>('postal');
  const [accentColor, setAccentColor] = useState('#D9C5B2');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [fieldsRevealed, setFieldsRevealed] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);
  const [showCaptureChoice, setShowCaptureChoice] = useState(false);
  const [capturePhase, setCapturePhase] = useState<'idle' | 'flash' | 'developing' | 'ready'>('idle');
  const [previewRotation, setPreviewRotation] = useState(0);

  const saveBtnScale = useSharedValue(1);
  const shimmerOpacity = useSharedValue(1);
  const flashOpacity = useSharedValue(0);
  const slideUpProgress = useSharedValue(0);
  const developProgress = useSharedValue(0);

  const insets = useSafeAreaInsets();
  const isEditMode = !!params.editId;

  // Shimmer animation
  useEffect(() => {
    if (metadataLoading) {
      shimmerOpacity.value = withSequence(
        withSpring(0.3, { damping: 8 }),
        withSpring(1, { damping: 8 }),
        withSpring(0.3, { damping: 8 }),
        withSpring(1, { damping: 8 }),
      );
    }
  }, [metadataLoading]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const instantCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(slideUpProgress.value, [0, 1], [300, 0]) },
      { rotate: `${interpolate(slideUpProgress.value, [0, 1], [12, previewRotation])}deg` },
    ],
    opacity: slideUpProgress.value,
  }));

  const developOverlayStyle = useAnimatedStyle(() => ({
    height: interpolate(developProgress.value, [0, 1], [280, 0]),
  }));

  const fetchConfig = async () => {
    const [variant, color, cats] = await Promise.all([
      storage.getDesignVariant(),
      storage.getAccentColor(),
      storage.getCategories(),
    ]);
    setDesignVariant(variant);
    setAccentColor(color);
    setAvailableCategories(cats);
    if (!params.initialCategory && cats.length > 0) setCategory(cats[0]);
  };

  useFocusEffect(
    useCallback(() => {
      fetchConfig();
    }, []),
  );

  // Reveal fields when image is set
  useEffect(() => {
    if (imageUri && !metadataLoading) {
      const timer = setTimeout(() => setFieldsRevealed(true), 400);
      return () => clearTimeout(timer);
    }
    if (!imageUri) {
      setFieldsRevealed(false);
    }
  }, [imageUri, metadataLoading]);

  const isFormValid = imageUri && title.trim().length > 0;

  const formattedDate = date
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/ /g, ' ');

  const handleCapture = async (source: 'camera' | 'gallery') => {
    setShowCaptureChoice(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const data = source === 'camera' ? await capturePhoto() : await pickImage();
    if (!data) return;

    setPreviewRotation((Math.random() - 0.5) * 4);
    setImageUri(data.uri);

    if (data.location) setLocation(data.location);
    if (data.date) setDate(data.date);

    setCapturePhase('flash');
    flashOpacity.value = withTiming(1, { duration: 60 }, () => {
      flashOpacity.value = withTiming(0, { duration: 350 });
    });

    setTimeout(() => {
      setCapturePhase('developing');
      slideUpProgress.value = withSpring(1, { damping: 18, stiffness: 80 });
      developProgress.value = withTiming(1, { duration: 1800, easing: Easing.bezier(0.35, 0.15, 0.25, 1) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 420);

    setTimeout(() => {
      setCapturePhase('ready');
      setMetadataLoading(false);
      setFieldsRevealed(true);
    }, 2400);
  };

  const handleSyncLocation = async () => {
    if (locLoading) return;
    Haptics.selectionAsync();
    setLocLoading(true);
    const loc = await getCurrentLocation();
    setLocLoading(false);
    if (loc) {
      setLocation(loc);
      showToast('Location found');
    } else {
      showToast('Could not find location', 'warning');
    }
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleSave = async () => {
    if (!imageUri) return;
    setSaving(true);

    try {
      // Generate title if empty
      const finalTitle = title.trim() || generateMemoryTitle(location, date);
      if (!title.trim()) {
        setTitle(finalTitle);
      }

      // Optimize image
      const { photoUri, thumbnailUri } = await saveAndOptimizeImage(imageUri);

      const formattedDate = date
        .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
        .replace(/\//g, '.');

      const ticketData: Ticket = {
        id: params.editId || Date.now().toString(),
        photoUri,
        thumbnailUri,
        title: finalTitle,
        note: note.trim(),
        location: location.trim() || 'Unknown',
        date: formattedDate,
        category,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        format: 'MEMORY TICKET',
      };

      if (params.editId) {
        const existing = await storage.getTickets();
        const oldTicket = existing.find(t => t.id === params.editId);
        const updated = existing.map(t => (t.id === params.editId ? ticketData : t));
        await storage.saveTicketsBatch(updated);

        // Delete old image files if the photo was replaced
        if (oldTicket && params.initialImageUri && params.initialImageUri !== imageUri) {
          const files = [oldTicket.photoUri, oldTicket.thumbnailUri].filter(Boolean) as string[];
          if (files.length > 0) {
            deleteImageFiles(...files);
          }
        }
      } else {
        await storage.saveTicket(ticketData);
      }

      setSaveComplete(true);

      await new Promise(r => setTimeout(r, 800));

      showToast('Memory preserved');
      setSaving(false);
      router.replace('/');
    } catch (err) {
      console.error(err);
      showToast('Could not save', 'error');
      setSaving(false);
    }
  };

  const animatedSaveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveBtnScale.value }],
  }));

  const generatedPlaceholder = !title && location
    ? generateMemoryTitle(location, date)
    : '';

  return (
    <ScreenContainer>
      <StatusBar barStyle="dark-content" />

      <HeaderBar title={isEditMode ? 'Edit Memory' : 'New Memory'} onBack={() => router.back()} backIcon="close" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo area */}
          <View style={styles.previewSection}>
            {imageUri && capturePhase !== 'idle' ? (
              <View style={styles.instantPrintBg}>
                <Animated.View style={[styles.instantPrintCard, instantCardStyle]}>
                  {designVariant === 'postal' && (
                    <View style={styles.editorPerfRow}>
                      {[...Array(6)].map((_, i) => (
                        <View key={`ep-${i}`} style={styles.editorPerfDot} />
                      ))}
                    </View>
                  )}
                  <View style={styles.instantPhotoWrap}>
                    <Image source={{ uri: imageUri }} style={styles.instantPhoto} />
                    {capturePhase === 'developing' && (
                      <Animated.View style={[styles.developOverlay, developOverlayStyle]} />
                    )}
                    <GrainTexture />
                  </View>
                </Animated.View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowCaptureChoice(true)}
                activeOpacity={0.85}
                style={styles.emptyFilm}
              >
                <View style={styles.emptyFilmInner}>
                  <View style={styles.emptyFilmFrame}>
                    <Ionicons name="camera-outline" size={32} color={Theme.colors.inkMuted} style={{ opacity: 0.5 }} />
                  </View>
                  <Text style={styles.emptyFilmText}>Tap to capture</Text>
                  <Text style={styles.emptyFilmSub}>a moment worth keeping</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Memory details */}
          {imageUri && !metadataLoading && fieldsRevealed && (
            <Animated.View
              entering={FadeInDown.delay(120).springify().damping(32).stiffness(100)}
            >
              <Card style={styles.fields}>
              <View style={styles.fieldRow}>
                <View style={styles.fieldBody}>
                  <Text style={[styles.fieldLabel, title.trim() ? styles.fieldLabelFloating : null]}>
                    What shall we call this memory?
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, { color: accentColor }]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder={generatedPlaceholder || 'A beautiful moment...'}
                    placeholderTextColor={`${Theme.colors.accent}40`}
                    maxLength={40}
                    selectionColor={accentColor}
                  />
                </View>
              </View>

              <Animated.View entering={FadeInDown.delay(240).springify().damping(32).stiffness(100)}>
                <View style={styles.fieldRow}>
                  <View style={styles.fieldBody}>
                    <Text style={[styles.fieldLabel, location.trim() ? styles.fieldLabelFloating : null]}>
                      Where did this happen?
                    </Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={location}
                      onChangeText={setLocation}
                      placeholder="A special place..."
                      placeholderTextColor={`${Theme.colors.accent}40`}
                      selectionColor={Theme.colors.ink}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={handleSyncLocation}
                    style={styles.rowAction}
                    disabled={locLoading}
                  >
                    {locLoading ? (
                      <ActivityIndicator size="small" color={Theme.colors.ink} />
                    ) : (
                      <Ionicons name="navigate-outline" size={18} color={Theme.colors.ink} />
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(360).springify().damping(32).stiffness(100)}>
                <TouchableOpacity
                  style={styles.fieldRow}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.fieldBody}>
                    <Text style={styles.fieldLabel}>When was this moment?</Text>
                    <Text style={styles.fieldValue}>{formattedDate}</Text>
                  </View>
                  <Ionicons name="calendar-outline" size={18} color={Theme.colors.accent} />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(480).springify().damping(32).stiffness(100)}>
                <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.fieldBody}>
                    <Text style={styles.fieldLabel}>What made this moment special?</Text>
                    <TextInput
                      style={[styles.fieldInput, styles.noteInput]}
                      value={note}
                      onChangeText={setNote}
                      placeholder="Write something to remember..."
                      placeholderTextColor={`${Theme.colors.accent}40`}
                      multiline
                      maxLength={NOTE_MAX}
                      numberOfLines={3}
                      textAlignVertical="top"
                      selectionColor={Theme.colors.ink}
                    />
                    <Text style={styles.charCounter}>
                      {note.length}/{NOTE_MAX}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </Card>
            </Animated.View>
          )}

          {/* Category */}
          {imageUri && !metadataLoading && fieldsRevealed && (
            <Animated.View
              entering={FadeInDown.delay(600).springify().damping(32).stiffness(100)}
              style={styles.categorySection}
            >
              <Text style={styles.sectionLabel}>What kind of memory is this?</Text>
              <View style={styles.categoryGrid}>
                {availableCategories.map(cat => {
                  const active = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catChip,
                        active
                          ? { backgroundColor: accentColor, borderColor: accentColor, ...Theme.shadows.subtle }
                          : { backgroundColor: Theme.colors.glass, borderColor: Theme.colors.border },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCategory(cat);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.catLabel, active && { color: Theme.colors.black }]}>
                        {cat.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Save button */}
        {imageUri && !metadataLoading && (
          <Animated.View
            entering={FadeInDown.delay(720).springify().damping(32).stiffness(100)}
            style={[styles.stickyCta, { paddingBottom: (Platform.OS === 'ios' ? 40 : 24) + insets.bottom }, animatedSaveStyle]}
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.ctaBtn, saving && styles.ctaBtnSaving]}
              activeOpacity={0.9}
              onPressIn={() => (saveBtnScale.value = withSpring(0.97))}
              onPressOut={() => (saveBtnScale.value = withSpring(1))}
            >
              {saving ? (
                saveComplete ? (
                  <View style={styles.saveSuccess}>
                    <Ionicons name="checkmark-circle" size={22} color={Theme.colors.white} />
                    <Text style={styles.ctaBtnText}>Preserved</Text>
                  </View>
                ) : (
                  <ActivityIndicator size="small" color={Theme.colors.white} />
                )
              ) : (
                <>
                  <Ionicons name="heart" size={18} color={Theme.colors.white} />
                  <Text style={styles.ctaBtnText}>
                    {isEditMode ? 'Update Memory' : 'Preserve This Memory'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          maximumDate={new Date()}
          textColor={Theme.colors.ink}
        />
      )}

      {/* White flash overlay */}
      <Animated.View style={[styles.flashOverlay, flashStyle]} pointerEvents="none" />

      {/* Capture source choice sheet */}
      <Modal visible={showCaptureChoice} transparent animationType="fade" onRequestClose={() => setShowCaptureChoice(false)}>
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={styles.sheetOverlay} onPress={() => setShowCaptureChoice(false)}>
            <Animated.View entering={FadeInDown.springify()}>
              <Card style={styles.sheetCard}>
                <View style={styles.sheetHandle} />
                <TouchableOpacity
                  style={styles.sheetRow}
                  onPress={() => handleCapture('camera')}
                >
                  <View style={styles.sheetIconWrap}>
                    <Ionicons name="camera" size={22} color={Theme.colors.ink} />
                  </View>
                  <View style={styles.sheetLabelWrap}>
                    <Text style={styles.sheetLabel}>Take Photo</Text>
                    <Text style={styles.sheetSub}>Capture with your camera</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sheetRow, { borderBottomWidth: 0 }]}
                  onPress={() => handleCapture('gallery')}
                >
                  <View style={styles.sheetIconWrap}>
                    <Ionicons name="images-outline" size={22} color={Theme.colors.ink} />
                  </View>
                  <View style={styles.sheetLabelWrap}>
                    <Text style={styles.sheetLabel}>Choose from Gallery</Text>
                    <Text style={styles.sheetSub}>Pick an existing photo</Text>
                  </View>
                </TouchableOpacity>
              </Card>
            </Animated.View>
          </Pressable>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  previewSection: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: Theme.spacing.xl },

  /* Instant print preview */
  instantPrintBg: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    paddingVertical: 8,
  },
  instantPrintCard: {
    width: '85%',
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.card,
    padding: 12,
    paddingBottom: 28,
    shadowColor: '#4A3728',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  editorPerfRow: {
    position: 'absolute',
    top: -5,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    zIndex: 10,
  },
  editorPerfDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.background,
    borderWidth: 0.5,
    borderColor: Theme.colors.border,
    opacity: 0.5,
  },
  instantPhotoWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Theme.colors.skeleton,
    position: 'relative',
  },
  instantPhoto: {
    width: '100%',
    height: '100%',
  },
  developOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.colors.card,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  /* Empty film state */
  emptyFilm: {
    width: '100%',
    maxWidth: 400,
    aspectRatio: 0.85,
    borderRadius: Theme.borderRadius.card,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.subtle,
  },
  emptyFilmInner: {
    alignItems: 'center',
    gap: 16,
  },
  emptyFilmFrame: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  emptyFilmText: {
    ...Theme.typography.body,
    fontSize: 15,
    color: Theme.colors.ink,
    letterSpacing: 0.5,
  },
  emptyFilmSub: {
    ...Theme.typography.caption,
    fontSize: 12,
    color: Theme.colors.inkMuted,
    letterSpacing: 0.3,
  },

  /* Flash overlay */
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
  },

  /* Capture choice sheet */
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Theme.colors.overlay,
  },
  sheetCard: {
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
  sheetIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  sheetLabelWrap: { flex: 1 },
  sheetLabel: {
    ...Theme.typography.body,
    fontSize: 15,
    color: Theme.colors.ink,
    fontWeight: '600',
  },
  sheetSub: {
    ...Theme.typography.caption,
    fontSize: 11,
    color: Theme.colors.inkMuted,
    marginTop: 2,
  },

  fields: {
    marginHorizontal: Theme.spacing.xl,
    overflow: 'hidden',
    ...Theme.shadows.subtle,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    gap: 14,
  },
  fieldBody: { flex: 1 },
  fieldLabel: {
    ...Theme.typography.label,
    fontSize: 8,
    color: Theme.colors.inkMuted,
    marginBottom: 6,
    letterSpacing: 1,
    fontWeight: '500',
  },
  fieldLabelFloating: { color: Theme.colors.ink },
  fieldInput: { ...Theme.typography.body, fontSize: 15, color: Theme.colors.ink, padding: 0 },
  fieldValue: { ...Theme.typography.body, fontSize: 15, color: Theme.colors.ink },
  noteInput: { minHeight: 80, lineHeight: 24 },
  charCounter: { ...Theme.typography.monoSmall, textAlign: 'right', marginTop: 4, color: Theme.colors.inkMuted },
  rowAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  categorySection: { marginTop: Theme.spacing.xl, paddingHorizontal: Theme.spacing.xl },
  sectionLabel: {
    ...Theme.typography.label,
    fontSize: 8,
    color: Theme.colors.inkMuted,
    marginBottom: 14,
    marginLeft: 4,
    fontWeight: '500',
    letterSpacing: 1,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.soft,
    borderWidth: 1,
  },
  catLabel: { ...Theme.typography.label, fontSize: 10, color: Theme.colors.inkMuted, fontWeight: '600' },
  stickyCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Theme.spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
    backgroundColor: Theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  ctaBtn: {
    height: 56,
    borderRadius: Theme.borderRadius.container,
    backgroundColor: Theme.colors.ink,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  ctaBtnSaving: { opacity: 0.9 },
  ctaBtnText: {
    ...Theme.typography.label,
    fontSize: 12,
    color: Theme.colors.white,
    fontWeight: '800',
    letterSpacing: 2,
  },
  saveSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
