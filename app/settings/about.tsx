import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer, HeaderBar, Card } from '@/components/ui';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <HeaderBar title="About" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Ionicons name="heart" size={32} color={Theme.colors.ink} />
          </View>
          <Text style={styles.appName}>
            Memory<Text style={{ fontWeight: '300', color: Theme.colors.inkMuted }}>Ticket</Text>
          </Text>
          <Text style={styles.tagline}>A quiet tool for the moments that matter.</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <Card style={styles.manifesto}>
          <Text style={styles.manifestoText}>
            Every photograph holds a story. A laugh shared, a view that stopped you, a moment you
            knew you&apos;d want to feel again.
          </Text>
          <Text style={styles.manifestoText}>
            Memory Ticket was built to help you keep those stories close. Not as files in a folder,
            but as beautiful artifacts you can hold onto, flip through, and revisit whenever you need
            to remember what matters.
          </Text>
          <Text style={styles.manifestoText}>
            No cloud, no subscriptions, no algorithms. Just your memories, preserved on your terms.
          </Text>
        </Card>

        <Card style={styles.makerCard}>
          <View style={styles.makerInfo}>
            <View style={styles.makerEmojiWrap}>
              <Text style={styles.makerEmoji}>✧</Text>
            </View>
            <View style={styles.makerTextWrap}>
              <Text style={styles.makerLabel}>Crafted by</Text>
              <Text style={styles.makerName}>a small team who believes{'\n'}memories deserve beauty</Text>
            </View>
          </View>
        </Card>

        <View style={styles.footerNote}>
          <Text style={styles.footerItalic}>Every ticket tells a story.</Text>
          <Text style={styles.copyright}>© 2026 · Built with care, for moments that matter</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Theme.spacing.xl, paddingBottom: 60 },
  hero: { alignItems: 'center', paddingVertical: 48 },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: Theme.borderRadius.container,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  appName: { ...Theme.typography.display, fontSize: 26, letterSpacing: 2, color: Theme.colors.ink },
  tagline: { ...Theme.typography.body, fontSize: 14, color: Theme.colors.inkMuted, marginTop: 8 },
  version: { ...Theme.typography.monoSmall, fontSize: 9, color: Theme.colors.inkMuted, marginTop: 12 },
  manifesto: {
    padding: 28,
    gap: 16,
  },
  manifestoText: { ...Theme.typography.body, fontSize: 15, lineHeight: 26, color: Theme.colors.ink },
  makerCard: {
    marginTop: 32,
  },
  makerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
  },
  makerEmojiWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Theme.colors.border,
  },
  makerEmoji: { fontSize: 20, color: Theme.colors.accent },
  makerLabel: { ...Theme.typography.caption, fontSize: 11, color: Theme.colors.inkMuted },
  makerName: { ...Theme.typography.body, fontSize: 14, lineHeight: 20, color: Theme.colors.ink, marginTop: 2 },
  makerTextWrap: { flex: 1 },
  footerNote: { marginTop: 48, alignItems: 'center', gap: 8 },
  footerItalic: { ...Theme.typography.note, fontSize: 13, color: Theme.colors.inkMuted, textAlign: 'center' },
  copyright: { ...Theme.typography.monoSmall, fontSize: 8, color: Theme.colors.inkMuted, textAlign: 'center' },
});
