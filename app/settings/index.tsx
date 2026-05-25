import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ScreenContainer, HeaderBar, Card } from '@/components/ui';
import { Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { storage } from '@/utils/storage';
import * as Haptics from 'expo-haptics';
import { clearAllImageFiles } from '@/utils/files';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
  danger?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, label, description, onPress, danger }) => (
  <TouchableOpacity
    style={[styles.item, danger && styles.itemDanger]}
    activeOpacity={0.7}
    onPress={() => {
      Haptics.selectionAsync();
      onPress();
    }}
  >
    <View style={styles.itemLead}>
      <Ionicons name={icon} size={20} color={danger ? Theme.colors.danger : Theme.colors.ink} />
      <View style={styles.itemTextWrap}>
        <Text style={[styles.itemLabel, danger && styles.itemLabelDanger]}>{label}</Text>
        {description ? <Text style={styles.itemDescription}>{description}</Text> : null}
      </View>
    </View>
    <Ionicons name="chevron-forward" size={16} color={Theme.colors.border} />
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();

  const handleWipeData = () => {
    Alert.alert(
      'Erase All Memories',
      'This will permanently delete every memory ticket and all your preferences. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All your memories will be gone forever. There is no undo for this action.',
              [
                { text: 'Keep Everything', style: 'cancel' },
                {
                  text: 'Erase Everything',
                  style: 'destructive',
                  onPress: async () => {
                    await clearAllImageFiles();
                    await storage.clearAllData();
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    router.replace('/onboarding');
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer>
      <HeaderBar title="Settings" onBack={() => router.back()} backIcon="close" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>APPEARANCE</Text>
          <Card>
            <SettingItem
              icon="color-palette-outline"
              label="Ticket Style"
              description="Choose your ticket design and accent color"
              onPress={() => router.push('/settings/config')}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INFORMATION</Text>
          <Card>
            <SettingItem
              icon="heart-outline"
              label="About Memory Ticket"
              description="The story behind this app"
              onPress={() => router.push('/settings/about')}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              label="Privacy"
              description="How your data is handled"
              onPress={() => router.push('/settings/privacy')}
            />
            <SettingItem
              icon="document-text-outline"
              label="Terms"
              description="Conditions of use"
              onPress={() => router.push('/settings/terms')}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATA</Text>
          <Card>
            <SettingItem
              icon="trash-outline"
              label="Erase All Memories"
              description="Permanently delete everything"
              onPress={handleWipeData}
              danger
            />
          </Card>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Memory Ticket v1.0.0</Text>
          <Text style={styles.disclaimer}>Made with care, for memories worth keeping.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: 12,
    paddingBottom: 60,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    ...Theme.typography.label,
    fontSize: 10,
    color: Theme.colors.inkMuted,
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1.5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  itemDanger: {
    borderBottomWidth: 0,
  },
  itemLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  itemTextWrap: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    ...Theme.typography.body,
    fontSize: 14,
    color: Theme.colors.ink,
  },
  itemLabelDanger: {
    color: Theme.colors.danger,
  },
  itemDescription: {
    ...Theme.typography.caption,
    fontSize: 11,
    color: Theme.colors.inkMuted,
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
    gap: 4,
  },
  versionText: {
    ...Theme.typography.monoSmall,
    fontSize: 9,
    color: Theme.colors.inkMuted,
  },
  disclaimer: {
    ...Theme.typography.caption,
    fontSize: 10,
    color: Theme.colors.inkMuted,
    fontStyle: 'italic',
  },
});
