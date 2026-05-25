import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer, HeaderBar } from '@/components/ui';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <HeaderBar title="Terms" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.introCard}>
          <Ionicons name="document-text" size={28} color={Theme.colors.ink} />
          <Text style={styles.introTitle}>Simple and fair.</Text>
          <Text style={styles.introSub}>
            By using Memory Ticket, you agree to these terms. They exist to protect you and your
            memories.
          </Text>
        </View>

        <Section title="Your Memories Belong to You" text="Every photo, note, and ticket you create is yours. Memory Ticket claims no ownership over your content. We don't license, sell, or distribute your data — because we never have access to it in the first place." />

        <Section title="You Are Responsible for Your Device" text="Since everything is stored locally, keeping your device secure is up to you. We recommend using your phone's built-in screen lock and encryption features to protect your archive." />

        <Section title="No Warranties" text="Memory Ticket is provided as-is. While we work hard to make it reliable, we cannot guarantee that data loss will never occur. We strongly recommend occasionally exporting your favorite tickets as a backup." />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Memory Ticket v1.0.0 · May 2026</Text>
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
