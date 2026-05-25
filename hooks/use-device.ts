import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { extractExifDate, extractExifLocation } from '@/utils/memory-titles';

export interface DeviceMetadata {
  uri: string;
  location?: string;
  date?: Date;
  exifDate?: Date;
}

export const useDevice = () => {
  const [loading, setLoading] = useState(false);

  const requestPermission = async (
    permissionFn: () => Promise<{ status: string }>,
    name: string,
  ) => {
    const { status } = await permissionFn();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Needed',
        `We need ${name} access to preserve your memories. Please enable it in settings.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return false;
    }
    return true;
  };

  const capturePhoto = async (): Promise<DeviceMetadata | null> => {
    const hasPermission = await requestPermission(
      ImagePicker.requestCameraPermissionsAsync,
      'Camera',
    );
    if (!hasPermission) return null;

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const exif = asset.exif as Record<string, any> | null;
        const exifDate = extractExifDate(exif);
        const coords = extractExifLocation(exif);

        let locationName = '';
        if (coords.latitude !== undefined && coords.longitude !== undefined) {
          try {
            const reverse = await Location.reverseGeocodeAsync({
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
            if (reverse[0]) {
              const { city, region, country } = reverse[0];
              locationName = [city, region, country].filter(Boolean).join(', ');
            }
          } catch {}
        }

        return {
          uri: asset.uri,
          location: locationName,
          date: exifDate || new Date(),
          exifDate: exifDate || undefined,
        };
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    } finally {
      setLoading(false);
    }
    return null;
  };

  const pickImage = async (): Promise<DeviceMetadata | null> => {
    if (Platform.OS === 'ios') {
      const hasPermission = await requestPermission(
        ImagePicker.requestMediaLibraryPermissionsAsync,
        'Photo Library',
      );
      if (!hasPermission) return null;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const exif = asset.exif as Record<string, any> | null;

        const exifDate = extractExifDate(exif);
        const coords = extractExifLocation(exif);

        let locationName = '';

        if (coords.latitude !== undefined && coords.longitude !== undefined) {
          try {
            const reverse = await Location.reverseGeocodeAsync({
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
            if (reverse[0]) {
              const { city, region, country } = reverse[0];
              locationName = [city, region, country].filter(Boolean).join(', ');
            }
          } catch {
            // geocoding silently fails, location stays empty
          }
        }

        return {
          uri: asset.uri,
          location: locationName,
          date: exifDate || new Date(),
          exifDate: exifDate || undefined,
        };
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image.');
    } finally {
      setLoading(false);
    }
    return null;
  };

  const getCurrentLocation = async (): Promise<string | null> => {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status: requestedStatus } = await Location.requestForegroundPermissionsAsync();
        finalStatus = requestedStatus;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Location Access',
          'Location is used to tag where your memories were created. Please enable it in settings.',
          [{ text: 'Cancel' }, { text: 'Settings', onPress: () => Linking.openSettings() }],
        );
        return null;
      }

      setLoading(true);

      const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 600000 });
      const freshLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }).catch(() => null);

      const targetLocation = freshLocation || lastKnown;

      if (targetLocation) {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: targetLocation.coords.latitude,
          longitude: targetLocation.coords.longitude,
        });

        if (reverse[0]) {
          const { city, region, country } = reverse[0];
          return [city, region, country].filter(Boolean).join(', ');
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    capturePhoto,
    pickImage,
    getCurrentLocation,
    loading,
    requestMediaLibraryPermission: () =>
      requestPermission(MediaLibrary.requestPermissionsAsync, 'Media Library'),
  };
};
