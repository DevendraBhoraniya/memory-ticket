import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText,
  cancelText = 'CANCEL',
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut} style={styles.backdrop}>
          <LinearGradient
            colors={[Palette.primaryTransparentMedium, Palette.primaryTransparentHeavy]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.springify()} style={styles.modalCard}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.confirmButton, danger && styles.dangerButton]} 
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={[styles.confirmText, danger && styles.dangerText]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Palette.paper,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.premium,
  },
  title: {
    ...Typography.h2Modal,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    lineHeight: 28,
  },
  message: {
    ...Typography.bodyModal,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: Palette.secondaryTransparentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.labelModalButton,
    color: Palette.secondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: Palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: Palette.danger,
  },
  confirmText: {
    ...Typography.labelModalButton,
    color: Palette.background,
  },
  dangerText: {
    color: Palette.white,
  },
});
