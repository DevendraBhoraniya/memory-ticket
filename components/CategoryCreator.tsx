import React, { useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { storage } from '@/utils/storage';
import { Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface CategoryCreatorProps {
  onAdded: () => void;
}

export const CategoryCreator: React.FC<CategoryCreatorProps> = ({ onAdded }) => {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    await storage.addCategory(name.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName('');
    setVisible(false);
    onAdded();
  };

  return (
    <>
      <TouchableOpacity style={styles.addBtn} onPress={() => setVisible(true)}>
        <Ionicons name="add-circle-outline" size={18} color={Theme.colors.accent} />
        <Text style={styles.addBtnText}>Add a category</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>New Category</Text>
            <Text style={styles.sheetSub}>What kind of memories belong here?</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Vintage, Architecture"
              placeholderTextColor={`${Theme.colors.accent}40`}
              autoFocus
              selectionColor={Theme.colors.ink}
            />
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd}>
                <Text style={styles.confirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  addBtnText: { ...Theme.typography.caption, fontSize: 12, color: Theme.colors.accent },
  overlay: { flex: 1, backgroundColor: Theme.colors.overlay, justifyContent: 'center', padding: Theme.spacing.xl },
  sheet: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.container, padding: 24, ...Theme.shadows.elevated },
  sheetTitle: { ...Theme.typography.displaySmall, fontSize: 18, textAlign: 'center', marginBottom: 4, color: Theme.colors.ink },
  sheetSub: { ...Theme.typography.caption, fontSize: 12, textAlign: 'center', marginBottom: 24, color: Theme.colors.inkMuted },
  input: {
    backgroundColor: Theme.colors.surface,
    height: 56,
    borderRadius: Theme.borderRadius.soft,
    paddingHorizontal: 16,
    ...Theme.typography.body,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    fontSize: 15,
  },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 },
  cancelBtn: { padding: 12 },
  cancelText: { ...Theme.typography.label, fontSize: 9, color: Theme.colors.inkMuted },
  confirmBtn: { backgroundColor: Theme.colors.ink, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 8 },
  confirmText: { ...Theme.typography.label, fontSize: 9, color: Theme.colors.white, fontWeight: '900' },
});
