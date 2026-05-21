import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import { useToast } from '@/app/_layout';

export type PermissionKind = 'photos' | 'gallery' | 'location';

interface PermissionState {
  visible: boolean;
  kind: PermissionKind;
  isPermanentlyDenied: boolean;
}

export const usePermissionGate = () => {
  const { showToast } = useToast();
  const [gate, setGate] = useState<PermissionState>({
    visible: false,
    kind: 'photos',
    isPermanentlyDenied: false,
  });

  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const closeGate = useCallback(() => {
    setGate(prev => ({ ...prev, visible: false }));
    setPendingAction(null);
  }, []);

  const checkPhotosPermission = useCallback(async (onGranted: () => void) => {
    try {
      const { status, canAskAgain } = await ImagePicker.getMediaLibraryPermissionsAsync();
      
      if (status === 'granted') {
        onGranted();
        return;
      }

      if (!canAskAgain && status !== 'undetermined') {
        setGate({ visible: true, kind: 'photos', isPermanentlyDenied: true });
        return;
      }

      setPendingAction(() => onGranted);
      setGate({ visible: true, kind: 'photos', isPermanentlyDenied: false });
    } catch (error) {
      console.error('Error checking photos permission:', error);
      showToast('Permission check failed', 'error');
    }
  }, [showToast]);

  const checkGalleryPermission = useCallback(async (onGranted: () => void) => {
    try {
      const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync(true);
      
      if (status === 'granted') {
        onGranted();
        return;
      }

      if (!canAskAgain && status !== 'undetermined') {
        setGate({ visible: true, kind: 'gallery', isPermanentlyDenied: true });
        return;
      }

      setPendingAction(() => onGranted);
      setGate({ visible: true, kind: 'gallery', isPermanentlyDenied: false });
    } catch (error) {
      console.error('Error checking gallery permission:', error);
      showToast('Permission check failed', 'error');
    }
  }, [showToast]);

  const checkLocationPermission = useCallback(async (onGranted: () => void) => {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      if (status === 'granted') {
        onGranted();
        return;
      }

      if (!canAskAgain && status !== 'undetermined') {
        setGate({ visible: true, kind: 'location', isPermanentlyDenied: true });
        return;
      }

      setPendingAction(() => onGranted);
      setGate({ visible: true, kind: 'location', isPermanentlyDenied: false });
    } catch (error) {
      console.error('Error checking location permission:', error);
      showToast('Location unavailable', 'error');
    }
  }, [showToast]);

  const requestPhotosPermission = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status === 'granted') {
        pendingAction?.();
      } else {
        showToast('Photo access denied', 'error');
      }
    } catch (error) {
      showToast('Request failed', 'error');
    } finally {
      closeGate();
    }
  }, [pendingAction, closeGate, showToast]);

  const requestGalleryPermission = useCallback(async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status === 'granted') {
        pendingAction?.();
      } else {
        showToast('Gallery access denied', 'error');
      }
    } catch (error) {
      showToast('Request failed', 'error');
    } finally {
      closeGate();
    }
  }, [pendingAction, closeGate, showToast]);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        pendingAction?.();
      } else {
        showToast('Location access denied', 'error');
      }
    } catch (error) {
      showToast('Request failed', 'error');
    } finally {
      closeGate();
    }
  }, [pendingAction, closeGate, showToast]);

  const confirmPermission = useCallback(async () => {
    if (gate.kind === 'photos') await requestPhotosPermission();
    else if (gate.kind === 'gallery') await requestGalleryPermission();
    else if (gate.kind === 'location') await requestLocationPermission();
  }, [gate.kind, requestPhotosPermission, requestGalleryPermission, requestLocationPermission]);

  return {
    gate,
    closeGate,
    checkPhotosPermission,
    checkGalleryPermission,
    checkLocationPermission,
    confirmPermission,
  };
};
