import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Pressable,
  Dimensions,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState, useMemo, useRef } from 'react';
import { Theme } from '@/theme';
import { TicketCard, TicketCardSkeleton } from '@/components/TicketCard';
import { useTickets } from '@/hooks/use-tickets';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { storage } from '@/utils/storage';
import { CategoryCreator } from '@/components/CategoryCreator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer, SearchBar, Card } from '@/components/ui';

const { width } = Dimensions.get('window');
const AnimatedView = Animated.View;

type SortOption = 'date' | 'title';

const GrainTexture = () => {
  const dots = useMemo(() => {
    const result: React.ReactNode[] = [];
    for (let r = 0; r < 40; r++) {
      for (let c = 0; c < 20; c++) {
        const opacity = 0.006 + ((r * 7 + c * 13) % 9) * 0.003;
        if (opacity > 0.01) {
          result.push(
            <View
              key={`g-${r}-${c}`}
              style={{
                position: 'absolute',
                top: r * 12 + (c % 4),
                left: c * 12 + (r % 3),
                width: 1,
                height: 1,
                borderRadius: 0.5,
                backgroundColor: Theme.colors.ink,
                opacity,
              }}
            />
          );
        }
      }
    }
    return result;
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" collapsable={false}>
      {dots}
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    tickets,
    loading,
    refreshTickets,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
  } = useTickets();

  const isFirstLoad = useRef(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [designVariant, setDesignVariant] = useState<'postal' | 'instant'>('postal');
  const [accentColor, setAccentColor] = useState('#D9C5B2');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const fetchSystemConfig = async () => {
    const [variant, color, cats] = await Promise.all([
      storage.getDesignVariant(),
      storage.getAccentColor(),
      storage.getCategories(),
    ]);
    setDesignVariant(variant);
    setAccentColor(color);
    setAvailableCategories(cats);
  };

  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        refreshTickets();
      } else {
        refreshTickets(true);
      }
      fetchSystemConfig();
    }, [refreshTickets])
  );

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.title.localeCompare(b.title);
    });
  }, [tickets, sortBy]);

  const handleCreateNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/editor');
  };

  const handleTicketPress = (id: string) => {
    router.push(`/ticket/${id}`);
  };

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <TicketCard
        ticket={item}
        index={index}
        onPress={() => handleTicketPress(item.id)}
        variant="grid"
        design={designVariant}
        accentColor={accentColor}
      />
    ),
    [designVariant, accentColor]
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  if (loading && tickets.length === 0) {
    return (
      <ScreenContainer edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.headerMain}>
          <View>
            <Text style={styles.wordmark}>Memory Ticket</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color={Theme.colors.ink} />
          </TouchableOpacity>
        </View>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          focused={searchFocused}
          placeholder="Search memories..."
          style={{
            marginHorizontal: Theme.spacing.xl,
            marginBottom: Theme.spacing.lg,
            backgroundColor: Theme.colors.surface,
            borderColor: searchFocused ? Theme.colors.accent : Theme.colors.borderLight,
            borderRadius: Theme.borderRadius.soft,
            height: 42,
            paddingHorizontal: 16,
          }}
        />
        <FlatList
          data={sortedTickets}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="camera-outline" size={24} color={Theme.colors.inkMuted} />
                </View>
                <Text style={styles.emptyTitle}>Your box is empty</Text>
                <Text style={styles.emptySub}>
                  The best memories start with a single moment.{'\n'}Press the button below to begin.
                </Text>
                <TouchableOpacity style={styles.emptyButton} onPress={handleCreateNew}>
                  <Ionicons name="heart" size={14} color={Theme.colors.white} />
                  <Text style={styles.emptyButtonText}>Capture your first memory</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(item) => String(item)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ index }) => <TicketCardSkeleton index={index} />}
          contentContainerStyle={styles.listContent}
        />
        <GrainTexture />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.headerMain}>
        <View>
          <Text style={styles.wordmark}>Memory Ticket</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={20} color={Theme.colors.ink} />
        </TouchableOpacity>
      </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          focused={searchFocused}
          placeholder="Search memories..."
          style={{
            marginHorizontal: Theme.spacing.xl,
            marginBottom: Theme.spacing.lg,
            backgroundColor: Theme.colors.surface,
            borderColor: searchFocused ? Theme.colors.accent : Theme.colors.borderLight,
            borderRadius: Theme.borderRadius.soft,
            height: 42,
            paddingHorizontal: 16,
          }}
        />
        {loading && tickets.length === 0 && (
          <FlatList
            data={[1, 2, 3, 4]}
            keyExtractor={(item) => String(item)}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ index }) => <TicketCardSkeleton index={index} />}
            contentContainerStyle={styles.listContent}
          />
        )}

      <FlatList
        data={sortedTickets}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="camera-outline" size={28} color={Theme.colors.inkMuted} />
              </View>
              <Text style={styles.emptyTitle}>Begin your collection</Text>
              <Text style={styles.emptySub}>
                Every meaningful moment deserves to be kept.
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleCreateNew}>
                <Ionicons name="heart" size={16} color={Theme.colors.white} />
                <Text style={styles.emptyButtonText}>Create Your First Memory</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <Modal visible={isMenuVisible} transparent animationType="fade" onRequestClose={() => setIsMenuVisible(false)}>
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={styles.modalOverlay} onPress={() => setIsMenuVisible(false)}>
            <AnimatedView entering={FadeInDown.springify()}>
              <Card style={styles.menuSheet}>
                <View style={styles.sheetHandle} />
                <Text style={styles.menuTitle}>Sort & Filter</Text>

                <View style={styles.menuSection}>
                  <Text style={styles.sectionLabel}>Sort by</Text>
                  <View style={styles.optionRow}>
                    {(['date', 'title'] as SortOption[]).map(opt => (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.optionRadio, sortBy === opt && styles.optionRadioActive]}
                        onPress={() => { Haptics.selectionAsync(); setSortBy(opt); }}
                      >
                        <View style={[styles.radioDot, sortBy === opt && styles.radioDotActive]} />
                        <Text style={[styles.optionRadioText, sortBy === opt && styles.optionRadioTextActive]}>
                          {opt === 'date' ? 'Date' : 'Title'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.menuSection}>
                  <Text style={styles.sectionLabel}>Category</Text>
                  <View style={styles.optionRow}>
                    <TouchableOpacity
                      style={[styles.optionRadio, selectedCategory === 'All' && styles.optionRadioActive]}
                      onPress={() => { Haptics.selectionAsync(); setSelectedCategory('All'); }}
                    >
                      <View style={[styles.radioDot, selectedCategory === 'All' && styles.radioDotActive]} />
                      <Text style={[styles.optionRadioText, selectedCategory === 'All' && styles.optionRadioTextActive]}>All</Text>
                    </TouchableOpacity>
                    {availableCategories.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.optionRadio, selectedCategory === cat && styles.optionRadioActive]}
                        onPress={() => { Haptics.selectionAsync(); setSelectedCategory(cat); }}
                      >
                        <View style={[styles.radioDot, selectedCategory === cat && styles.radioDotActive]} />
                        <Text style={[styles.optionRadioText, selectedCategory === cat && styles.optionRadioTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <CategoryCreator onAdded={fetchSystemConfig} />
                </View>
              </Card>
            </AnimatedView>
          </Pressable>
        </View>
      </Modal>

      <GrainTexture />

      <View style={[styles.bottomShelf, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleCreateNew}
          activeOpacity={0.85}
        >
          <Ionicons name="camera" size={20} color={Theme.colors.white} />
          <Text style={styles.fabLabel}>New Memory</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.sm,
  },
  wordmark: {
    ...Theme.typography.displaySmall,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridRow: {
    paddingHorizontal: Theme.spacing.xl,
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.lg,
  },
  listContent: {
    paddingBottom: 140,
  },
  sectionLabel: {
    ...Theme.typography.label,
    fontSize: 10,
    marginBottom: Theme.spacing.md,
    marginLeft: 4,
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xxl,
    gap: 20,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  emptyTitle: {
    ...Theme.typography.displaySmall,
    textAlign: 'center',
  },
  emptySub: {
    ...Theme.typography.body,
    textAlign: 'center',
    color: Theme.colors.inkMuted,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Theme.borderRadius.pill,
    backgroundColor: Theme.colors.ink,
    paddingHorizontal: 28,
    gap: 10,
    marginTop: 8,
  },
  emptyButtonText: {
    ...Theme.typography.label,
    fontSize: 11,
    color: Theme.colors.white,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Theme.colors.overlay,
  },
  menuSheet: {
    padding: Theme.spacing.xl,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: Theme.borderRadius.pill,
    backgroundColor: Theme.colors.border,
    alignSelf: 'center',
    marginBottom: Theme.spacing.lg,
  },
  menuTitle: {
    ...Theme.typography.displaySmall,
    fontSize: 17,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  menuSection: {
    marginBottom: Theme.spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  optionRadio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  optionRadioActive: {},
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDotActive: {
    borderColor: Theme.colors.ink,
    backgroundColor: Theme.colors.ink,
  },
  optionRadioText: {
    ...Theme.typography.body,
    fontSize: 14,
    color: Theme.colors.inkMuted,
  },
  optionRadioTextActive: {
    color: Theme.colors.ink,
    fontWeight: '600',
  },
  bottomShelf: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 16,
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Theme.colors.ink,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: Theme.borderRadius.container,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Theme.shadows.fab,
  },
  fabLabel: {
    ...Theme.typography.label,
    fontSize: 11,
    color: Theme.colors.white,
    letterSpacing: 2,
    fontWeight: '800',
  },
});
