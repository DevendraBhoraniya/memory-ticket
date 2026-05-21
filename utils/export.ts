import { useRef } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

export const useTicketExport = () => {
  const ticketRef = useRef<View>(null);

  const captureTicket = async (): Promise<string | null> => {
    try {
      if (!ticketRef.current) {
        throw new Error('Ticket reference not found');
      }

      const uri = await captureRef(ticketRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      return uri;
    } catch (error) {
      console.error('Error capturing ticket:', error);
      throw new Error('Could not capture ticket image. Please try again.');
    }
  };

  const shareTicketImage = async (): Promise<boolean> => {
    const uri = await captureTicket();
    if (!uri) return false;

    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      throw new Error('Sharing is not supported on this device.');
    }

    try {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Memory Ticket',
        UTI: 'public.png',
      });
      return true;
    } catch (error) {
      console.error('Error sharing ticket:', error);
      throw new Error('Could not share the ticket. Please try again.');
    }
  };

  const saveTicketImage = async (): Promise<boolean> => {
    const uri = await captureTicket();
    if (!uri) return false;

    try {
      console.log("[Export] Requesting write-only media library permissions...");
      // Using writeOnly: true avoids requesting READ_MEDIA_AUDIO/VIDEO on Android 13+
      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync(true);
      
      if (status !== 'granted') {
        if (!canAskAgain) {
          throw new Error('Permission permanently denied. Please enable it in settings.');
        }
        throw new Error('Permission to access your photo library is required.');
      }

      console.log("[Export] Creating asset...");
      const asset = await MediaLibrary.createAssetAsync(uri);
      
      console.log("[Export] Saving to album...");
      // false indicates we don't want to copy, just move or reference
      await MediaLibrary.createAlbumAsync('Memory Tickets', asset, false);
      
      console.log("[Export] Successfully saved to gallery.");
      return true;
    } catch (error: any) {
      console.error('[Export] Error saving ticket:', error);
      // Re-throw with a clean message for the Toast system
      throw new Error(error.message || 'Could not save the ticket to your gallery.');
    }
  };

  return {
    ticketRef,
    shareTicketImage,
    saveTicketImage,
    captureTicket,
  };
};
