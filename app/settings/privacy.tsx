import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer, HeaderBar } from '@/components/ui';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <HeaderBar title="Privacy" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.introCard}>
          <Ionicons name="shield-checkmark" size={28} color={Theme.colors.ink} />
          <Text style={styles.introTitle}>Your memories stay with you.</Text>
          <Text style={styles.introSub}>
            Memory Ticket is built entirely on-device. Your photos, notes, and locations never leave
            your phone unless you choose to share them.
          </Text>
        </View>

        <Section title="Where Your Data Lives" text="Everything you create — every ticket, photo, and note — is stored locally on your device. There are no cloud servers, no accounts, and no remote databases. Your archive belongs to you alone." />

        <Section title="Location & Permissions" text="When you choose to tag a memory with its location, the coordinates are processed on your device and stored only in your local archive. They are never transmitted anywhere else. You can always edit or remove location data." />

        <Section title="No Tracking" text="Memory Ticket does not include any analytics SDKs, advertising trackers, or third-party monitoring services. We don't collect usage data, crash reports, or any personal information." />

        <Section title="Sharing Is Your Choice" text="Exporting or sharing a memory ticket is always a manual action you initiate. Nothing is shared automatically. When you export, only what you see on the ticket is included." />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Last updated: May 2026</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const Section = ({ title, text }: { title: string; text: string }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Theme.spacing.xl, paddingBottom: 60 },
  introCard: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  introTitle: { ...Theme.typography.displaySmall, fontSize: 20, color: Theme.colors.ink, textAlign: 'center' },
  introSub: { ...Theme.typography.body, fontSize: 14, lineHeight: 22, color: Theme.colors.inkMuted, textAlign: 'center', paddingHorizontal: 12 },
  section: { marginBottom: 28 },
  sectionTitle: { ...Theme.typography.label, fontSize: 10, color: Theme.colors.inkMuted, marginBottom: 8, letterSpacing: 1 },
  sectionText: { ...Theme.typography.body, fontSize: 15, lineHeight: 24, color: Theme.colors.ink },
  footer: { marginTop: 32, paddingTop: 24, alignItems: 'center' },
  footerText: { ...Theme.typography.monoSmall, fontSize: 8, color: Theme.colors.inkMuted },
});
