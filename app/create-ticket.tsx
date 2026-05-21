import MemoryTicket from '@/components/MemoryTicket';
import { IconSymbol } from '@/components/ui/icon-symbol';
import PermissionModal from '@/components/ui/PermissionModal';
import { Palette, Shadows, Spacing, Typography } from '@/constants/theme';
import { usePermissionGate } from '@/hooks/use-permissions';
import { useTickets } from '@/hooks/use-tickets';
import { Ticket } from '@/types';
import { createThumbnail, fileExists, isTemporaryUri, saveImagePermanently } from '@/utils/files';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from './_layout';

export default function CreateTicketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { createTicket, updateTicket, tickets } = useTickets();
  const { gate, closeGate, checkPhotosPermission, checkLocationPermission, confirmPermission } = usePermissionGate();
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (ticketId) {
      setIsEditMode(true);
      if (tickets.length > 0) {
        loadExistingTicket(ticketId);
      }
    } else {
      setDate(new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }));
    }
  }, [ticketId, tickets.length]);

  const loadExistingTicket = async (id: string) => {
    try {
      const ticket = tickets.find((t) => t.id === id);
      if (ticket) {
        setImageUri(ticket.photoUri);
        setTitle(ticket.title);
        setNote(ticket.note);
        setLocation(ticket.location);
        setDate(ticket.date);

        // Check if the original image is missing
        if (ticket.photoUri) {
          const exists = await fileExists(ticket.photoUri);
          if (!exists) {
            console.warn(`[Edit] Stub ${id} has a missing image file.`);
            showToast('The original photo is missing', 'error');
          }
        }
      }
    } catch (error) {
      console.error('Error loading ticket for edit:', error);
      showToast('Failed to load ticket', 'error');
    }
  };

  const handleUseLocation = async () => {
    checkLocationPermission(async () => {
      setIsLocating(true);
      try {
        const { coords } = await Location.getCurrentPositionAsync({});
        const [address] = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });

        if (address) {
          const city = address.city || address.subregion || address.district;
          const country = address.country;
          const locationString = city && country ? `${city}, ${country}` : city || country || 'Nearby';
          setLocation(locationString);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          showToast('Location updated');
        }
      } catch (error) {
        console.error('Error getting location:', error);
        showToast('Could not fetch location', 'error');
      } finally {
        setIsLocating(false);
      }
    });
  };

  const pickImage = async () => {
    checkPhotosPermission(async () => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });

        if (!result.canceled) {
          setImageUri(result.assets[0].uri);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (error) {
        console.error('Error picking image:', error);
        showToast('Could not open gallery', 'error');
      }
    });
  };

  const handleSave = async () => {
    if (!imageUri || !title.trim()) {
      showToast('Add a photo and title', 'error');
      return;
    }

    setSaving(true);
    try {
      let finalImageUri = imageUri;
      let finalThumbUri = undefined;

      // Start with existing thumbnail if in edit mode
      if (isEditMode && ticketId) {
        const existing = tickets.find(t => t.id === ticketId);
        finalThumbUri = existing?.thumbnailUri;
      }

      // If the image is temporary (from picker) or changed, save it permanently and create thumbnail
      if (isTemporaryUri(imageUri)) {
        console.log("[Create] Safeguarding image and generating thumbnail...");
        finalImageUri = await saveImagePermanently(imageUri);
        finalThumbUri = await createThumbnail(finalImageUri);
      } else if (!finalThumbUri && finalImageUri) {
        // Just in case a permanent image is missing its thumbnail
        console.log("[Create] Generating missing thumbnail for permanent image...");
        finalThumbUri = await createThumbnail(finalImageUri);
      }

      if (isEditMode && ticketId) {
        const original = tickets.find(t => t.id === ticketId);
        
        const updated: Ticket = {
          id: ticketId,
          photoUri: finalImageUri,
          thumbnailUri: finalThumbUri,
          title: title.trim(),
          note: note.trim(),
          location: location.trim() || 'Somewhere',
          date: date,
          timestamp: original ? original.timestamp : Date.now(),
          createdAt: original ? original.createdAt : new Date().toISOString(),
        };

        await updateTicket(updated);
        showToast('Memory updated');
      } else {
        const newTicket: Ticket = {
          id: Date.now().toString() + Math.random().toString(36).substring(2),
          photoUri: finalImageUri,
          thumbnailUri: finalThumbUri,
          title: title.trim(),
          note: note.trim(),
          location: location.trim() || 'Somewhere',
          date: date,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
        };
        await createTicket(newTicket);
        showToast('Moment preserved');
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } catch (error) {
      console.error('Error saving ticket:', error);
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Refined Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <IconSymbol name="plus" size={24} color={Palette.primary} style={{ transform: [{ rotate: '45deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Stub' : 'New Stub'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.headerBtn}>
          {saving ? (
            <ActivityIndicator size="small" color={Palette.primary} />
          ) : (
            <Text style={[styles.saveAction, (!imageUri || !title.trim()) && styles.disabledAction]}>
              SAVE
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Live Preview Section */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.previewSection}>
            <TouchableOpacity 
              onPress={pickImage} 
              activeOpacity={0.9} 
              style={styles.ticketWrapper}
            >
              <MemoryTicket
                ticket={{ photoUri: imageUri, title, date, location, note }}
                variant="detail"
              />
              {!imageUri && (
                <View style={styles.imagePrompt}>
                  <IconSymbol name="photo.fill" size={42} color={Palette.accent} />
                  <Text style={styles.imagePromptText}>TAP TO SELECT PHOTO</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Form Section with Premium Spacing */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>THE TITLE</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Name this moment..."
                placeholderTextColor={Palette.accent}
                value={title}
                onChangeText={setTitle}
                maxLength={40}
                selectionColor={Palette.primary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>THE REFLECTION</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="What made this special?"
                placeholderTextColor={Palette.accent}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={4}
                maxLength={150}
                selectionColor={Palette.primary}
              />
            </View>

            <View style={styles.metadataGrid}>
              <View style={styles.metaField}>
                <View style={styles.metaLabelRow}>
                  <Text style={styles.inputLabel}>LOCATION</Text>
                  <TouchableOpacity onPress={handleUseLocation} disabled={isLocating}>
                    <Text style={styles.useLocationBtn}>
                      {isLocating ? 'LOCATING...' : 'USE CURRENT'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.metaInput}
                  placeholder="Somewhere..."
                  placeholderTextColor={Palette.accent}
                  value={location}
                  onChangeText={setLocation}
                  maxLength={30}
                  selectionColor={Palette.primary}
                />
              </View>
              <View style={styles.metaField}>
                <Text style={styles.inputLabel}>DATE</Text>
                <Text style={styles.dateText}>{date}</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PermissionModal
        visible={gate.visible}
        type={gate.kind}
        isPermanentlyDenied={gate.isPermanentlyDenied}
        title={
          gate.kind === 'photos' ? "Access Photos" : 
          gate.kind === 'gallery' ? "Save to Gallery" : 
          "Use Location"
        }
        message={gate.isPermanentlyDenied 
          ? "Permission was previously denied. Please enable it in your device settings to continue."
          : gate.kind === 'location'
            ? "We need your location to automatically tag where this memory was captured."
            : "We need access to your library to select and preserve your memories."
        }
        onConfirm={confirmPermission}
        onCancel={closeGate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  saveAction: {
    ...Typography.label,
    fontSize: 13,
    color: Palette.primary,
    fontWeight: '800',
    letterSpacing: 2,
  },
  disabledAction: {
    opacity: 0.2,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
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
    aspectRatio: undefined,
    ...Shadows.premium,
  },
  imagePrompt: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  imagePromptText: {
    ...Typography.label,
    marginTop: Spacing.md,
    color: Palette.accent,
    fontSize: 10,
    letterSpacing: 2,
  },
  formSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    ...Typography.label,
    fontSize: 9,
    marginBottom: Spacing.sm,
    color: Palette.secondary,
    opacity: 0.6,
  },
  titleInput: {
    ...Typography.heroTitle,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.secondaryTransparentLight,
    minHeight: 44,
  },
  noteInput: {
    ...Typography.formBody,
    textAlignVertical: 'top',
    minHeight: 100,
    maxHeight: 150,
    paddingVertical: Spacing.sm,
  },
  metadataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 213, 192, 0.5)',
  },
  metaField: {
    flex: 1,
    minHeight: 80,
  },
  metaLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  useLocationBtn: {
    ...Typography.label,
    fontSize: 8,
    color: Palette.primary,
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
  metaInput: {
    ...Typography.mono,
    fontSize: 15,
    color: Palette.primary,
    minHeight: 36,
    paddingVertical: Spacing.xs,
  },
  dateText: {
    ...Typography.mono,
    fontSize: 15,
    color: Palette.primary,
    opacity: 0.8,
    minHeight: 36,
    lineHeight: 24,
  },
});
