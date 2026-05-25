import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenContainer, HeaderBar, Card } from '@/components/ui';
import { Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { storage } from '@/utils/storage';
import * as Haptics from 'expo-haptics';

export default function ConfigScreen() {
  const router = useRouter();
  const [variant, setVariant] = useState<'postal' | 'instant'>('postal');

  useEffect(() => {
    (async () => {
      setVariant(await storage.getDesignVariant());
    })();
  }, []);

  const handleVariantChange = async (v: 'postal' | 'instant') => {
    Haptics.selectionAsync();
    setVariant(v);
    await storage.setDesignVariant(v);
  };

  return (
    <ScreenContainer>
      <HeaderBar title="Ticket Style" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Design</Text>
          <View style={styles.variantGrid}>
            <Card>
              <TouchableOpacity
                style={[styles.variantBtn, variant === 'postal' && styles.variantBtnActive]}
                onPress={() => handleVariantChange('postal')}
              >
                <Ionicons
                  name="mail-outline"
                  size={24}
                  color={variant === 'postal' ? Theme.colors.white : Theme.colors.ink}
                />
                <View style={styles.btnLabelWrap}>
                  <Text style={[styles.variantText, variant === 'postal' && styles.variantTextActive]}>
                    Postage Stamp
                  </Text>
                  <Text style={[styles.variantSub, variant === 'postal' && styles.variantSubActive]}>
                    Perforated edges and classic charm
                  </Text>
                </View>
              </TouchableOpacity>
            </Card>

            <Card>
              <TouchableOpacity
                style={[styles.variantBtn, variant === 'instant' && styles.variantBtnActive]}
                onPress={() => handleVariantChange('instant')}
              >
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color={variant === 'instant' ? Theme.colors.white : Theme.colors.ink}
                />
                <View style={styles.btnLabelWrap}>
                  <Text style={[styles.variantText, variant === 'instant' && styles.variantTextActive]}>
                    Instant Camera Photo
                  </Text>
                  <Text style={[styles.variantSub, variant === 'instant' && styles.variantSubActive]}>
                    Square prints with nostalgic charm
                  </Text>
                </View>
              </TouchableOpacity>
            </Card>
          </View>
        </View>

        <Card style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={Theme.colors.accent} />
          <Text style={styles.infoText}>
            This choice affects how your tickets appear throughout the app.
          </Text>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Theme.spacing.xl, paddingTop: 28 },
  section: { marginBottom: 40 },
  sectionLabel: { ...Theme.typography.label, fontSize: 10, color: Theme.colors.inkMuted, marginBottom: 16, marginLeft: 4, letterSpacing: 1.5 },
  variantGrid: { gap: 12 },
  variantBtn: {
    height: 86,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  variantBtnActive: { backgroundColor: Theme.colors.ink, borderColor: Theme.colors.ink },
  btnLabelWrap: { flex: 1 },
  variantText: { ...Theme.typography.body, fontSize: 15, color: Theme.colors.ink, fontWeight: '600' },
  variantTextActive: { color: Theme.colors.white },
  variantSub: { ...Theme.typography.caption, fontSize: 11, color: Theme.colors.inkMuted, marginTop: 2 },
  variantSubActive: { color: Theme.colors.white },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 40,
  },
  infoText: { ...Theme.typography.caption, fontSize: 12, color: Theme.colors.inkMuted, flex: 1, lineHeight: 18 },
});
