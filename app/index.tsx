import TicketCard from "@/components/TicketCard";
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTickets } from '@/hooks/use-tickets';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ArchiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tickets, loading, sortOrder, refreshTickets, toggleSortOrder } = useTickets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshTickets(searchQuery);
    }, [refreshTickets, searchQuery])
  );

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      refreshTickets(searchQuery);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, refreshTickets]);

  const handleTicketPress = (ticketId: string) => {
    router.push(`/ticket/${ticketId}`);
  };

  const handleCreatePress = () => {
    router.push('/create-ticket');
  };

  const handleToggleSort = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSortOrder();
  };

  const toggleSearch = () => {
    Haptics.selectionAsync();
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery('');
    }
  };

  const renderEmptyState = () => (
    <Animated.View entering={FadeIn.delay(400)} style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎫</Text>
      <Text style={styles.emptyText}>
        {searchQuery ? "No matches found." : "Your archive is quiet."}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery 
          ? "Try a different search term or clear the filter." 
          : "Begin your collectible journey by\npreserving your first moment."}
      </Text>
      {!searchQuery && (
        <TouchableOpacity 
          style={styles.emptyButton} 
          onPress={handleCreatePress}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyButtonText}>CREATE FIRST TICKET</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Editorial Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
        <Animated.View entering={FadeInDown.duration(800).springify()}>
          <Text style={styles.headerLabel}>COLLECTION</Text>
          <Text style={styles.headerTitle}>Archive</Text>
        </Animated.View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerIconButton} 
            onPress={toggleSearch}
            activeOpacity={0.7}
          >
            <IconSymbol 
              name={isSearchVisible ? "plus" : "magnifyingglass"} 
              size={22} 
              color={Palette.primary} 
              style={{ transform: [{ rotate: isSearchVisible ? '45deg' : '0deg' }] }} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerIconButton} 
            onPress={handleToggleSort}
            activeOpacity={0.7}
          >
            <IconSymbol 
              name="clock" 
              size={22} 
              color={Palette.primary} 
              style={{ opacity: sortOrder === 'DESC' ? 1 : 0.4 }}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.createIconButton} 
            onPress={handleCreatePress}
            activeOpacity={0.7}
          >
            <IconSymbol name="plus" size={26} color={Palette.background} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {isSearchVisible && (
        <Animated.View entering={SlideInUp.duration(400)} style={styles.searchContainer}>
          <View style={styles.searchInner}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title, location..."
              placeholderTextColor={Palette.accent}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              selectionColor={Palette.primary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearText}>CLEAR</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item, index }) => (
          <TicketCard 
            ticket={item} 
            index={index}
            onPress={() => handleTicketPress(item.id)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          tickets.length === 0 && { flex: 1 }
        ]}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={() => refreshTickets(searchQuery)} 
            tintColor={Palette.secondary}
          />
        }
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: Palette.background,
    zIndex: 20,
    minHeight: 80,
  },
  headerLabel: {
    ...Typography.headerLabel,
    marginBottom: 4,
  },
  headerTitle: {
    ...Typography.headerTitle,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.secondaryTransparentSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createIconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.soft,
  },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Palette.background,
    zIndex: 10,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.paper,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 54,
    ...Shadows.soft,
    borderWidth: 1,
    borderColor: Palette.secondaryTransparentLight,
  },
  searchInput: {
    flex: 1,
    ...Typography.searchInput,
    color: Palette.primary,
  },
  clearText: {
    ...Typography.labelSmall, // Reusing labelSmall
    color: Palette.accent,
    marginLeft: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.listContentPaddingBottom,
    paddingTop: Spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.emptyContainerPaddingBottom,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
    opacity: 0.6,
  },
  emptyText: {
    ...Typography.emptyText,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.emptySubtext,
    textAlign: 'center',
    marginBottom: Spacing.huge,
  },
  emptyButton: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.emptyButtonPaddingVertical,
    borderRadius: Spacing.emptyButtonBorderRadius, // Using Spacing for BorderRadius
    backgroundColor: Palette.primary,
    ...Shadows.premium,
  },
  emptyButtonText: {
    ...Typography.emptyButtonText,
    color: Palette.background,
  },
});
