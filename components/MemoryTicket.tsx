import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/theme';
import { Ticket } from '@/types';
import { fileExists } from '@/utils/files';
import { Image } from 'expo-image';
import React, { memo, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

interface MemoryTicketProps {
  ticket: Partial<Ticket>;
  variant?: 'card' | 'detail' | 'export';
  side?: 'front' | 'back';
}

const MemoryTicket: React.FC<MemoryTicketProps> = ({
  ticket,
  variant = 'detail',
  side = 'front',
}) => {
  const isCard = variant === 'card';
  const isExport = variant === 'export';
  const isBack = side === 'back';

  const [imageError, setImageError] = useState(false);
  const [checkingFile, setCheckingFile] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const verifyFile = async () => {
      if (ticket.photoUri) {
        setCheckingFile(true);
        try {
          const exists = await fileExists(ticket.photoUri);
          if (isMounted && !exists) {
            setImageError(true);
          }
        } catch {
          if (isMounted) setImageError(true);
        } finally {
          if (isMounted) setCheckingFile(false);
        }
      }
    };
    verifyFile();
    return () => { isMounted = false; };
  }, [ticket.photoUri, ticket.id]);

  if (isBack) {
    return (
      <View style={[styles.container, isCard ? styles.cardContainer : styles.detailContainer]}>
        <View style={[styles.ticketBody, styles.backBody, isCard && styles.ticketBodySmall]}>
          <View style={styles.backHeader}>
             <Text style={styles.backHeaderLabel}>REFLECTION ARCHIVE</Text>
             <View style={styles.backHeaderDivider} />
          </View>
          <ScrollView style={styles.backContent} contentContainerStyle={styles.backContentInner} showsVerticalScrollIndicator={false}>
            <Text style={styles.backNoteText}>{ticket.note || "A silent moment preserved in the archive."}</Text>
          </ScrollView>
          <View style={styles.backFooter}>
            <View style={styles.stampContainer}>
               <IconSymbol name="checkmark" size={24} color={Palette.accent} />
               <Text style={styles.stampText}>VERIFIED MEMORY</Text>
            </View>
            <View style={styles.backMeta}>
               <Text style={styles.backLabel}>ID: {ticket.id?.substring(0, 8).toUpperCase()}</Text>
               <Text style={styles.backLabel}>TS: {ticket.timestamp}</Text>
            </View>
          </View>
        </View>
        <View style={styles.bottomShadow} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isCard ? styles.cardContainer : styles.detailContainer, isExport && styles.exportContainer]}>
      <View style={[styles.ticketBody, isCard && styles.ticketBodySmall]}>
        <View style={[styles.imageSection, isCard && styles.imageSectionSmall, isExport && styles.imageSectionExport]}>
          {checkingFile ? (
            <View style={styles.placeholderImage}><ActivityIndicator size="small" color={Palette.accent} /></View>
          ) : ticket.photoUri && !imageError ? (
            <Image
              source={{ uri: ticket.photoUri }}
              style={styles.image}
              contentFit="cover"
              transition={isExport ? 0 : 800}
              placeholder="blur"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.placeholderImage, imageError && styles.missingImage]}>
              <IconSymbol name={imageError ? "exclamationmark.triangle.fill" : "photo.fill"} size={isCard ? 24 : 42} color={imageError ? Palette.danger : Palette.accent} style={{ marginBottom: Spacing.sm }} />
              <Text style={[styles.placeholderText, imageError && styles.missingText]}>{imageError ? "MISSING MEMORY" : "SILENT MOMENT"}</Text>
              {imageError && !isCard && <Text style={styles.recoveryHint}>Tap to replace in edit mode</Text>}
            </View>
          )}
          <View style={styles.imageOverlay} />
        </View>
        
        <View style={[styles.perforation, isCard && styles.perforationSmall]}>
          <View style={[styles.notch, styles.notchLeft, isCard && styles.notchSmall]} />
          <View style={styles.dashLine} />
          <View style={[styles.notch, styles.notchRight, isCard && styles.notchSmall]} />
        </View>

        <View style={[styles.infoSection, isCard && styles.infoSectionSmall, isExport && styles.infoSectionExport]}>
          <View style={styles.infoHeader}>
            <View style={styles.titleWrapper}>
              <Text style={[styles.metaLabel, isCard && styles.metaLabelSmall]}>MEMORABLE STUB</Text>
              <Text style={[styles.title, isCard && styles.titleSmall]} numberOfLines={isCard ? 1 : 2}>{ticket.title || 'Untitled'}</Text>
            </View>
            {!isCard && (
              <View style={styles.barcode}>
                 {[1, 3, 2, 5, 2, 1, 4, 2].map((w, i) => <View key={i} style={[styles.barcodeBar, { width: w }]} />)}
              </View>
            )}
          </View>
          {ticket.note && !isCard && <Text style={styles.note} numberOfLines={3}>{ticket.note}</Text>}
          <View style={[styles.footer, isCard && styles.footerSmall]}>
            <View style={styles.footerItem}>
              <Text style={styles.footerLabel}>CAPTURED</Text>
              <Text style={[styles.footerValue, isCard && styles.footerValueSmall]}>{ticket.date}</Text>
            </View>
            <View style={[styles.footerItem, styles.alignRight]}>
              <Text style={styles.footerLabel}>LOCATION</Text>
              <Text style={[styles.footerValue, isCard && styles.footerValueSmall]} numberOfLines={1}>{ticket.location || 'Unknown'}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.bottomShadow} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', ...Shadows.card },
  cardContainer: { borderRadius: BorderRadius.lg },
  detailContainer: { borderRadius: BorderRadius.xl },
  exportContainer: { width: 380, elevation: 0, shadowOpacity: 0 },
  ticketBody: { 
    backgroundColor: Palette.paper, 
    borderRadius: BorderRadius.xl, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: Palette.border, 
    zIndex: 2,
    // Add proper flex handling for all variants
    flex: 1,
    minHeight: 280,
  },
  ticketBodySmall: { 
    borderRadius: BorderRadius.lg,
    minHeight: 200,
  },
  imageSection: { 
    aspectRatio: 4 / 3,
    width: '100%', 
    backgroundColor: Palette.tertiary, 
    overflow: 'hidden',
  },
  imageSectionSmall: { 
    // aspectRatio: 4 / 3 maintained
  },
  imageSectionExport: { 
    // aspectRatio: 4 / 3 maintained for export consistency
  },
  image: { 
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imageOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: Palette.secondaryTransparentSubtle 
  },
  placeholderImage: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: Palette.tertiary 
  },
  missingImage: { 
    backgroundColor: 'rgba(255, 59, 48, 0.05)' 
  },
  placeholderText: { 
    ...Typography.label, 
    color: Palette.accent, 
    opacity: 0.5 
  },
  missingText: { 
    color: Palette.danger, 
    opacity: 0.8, 
    fontWeight: '700', 
    letterSpacing: 1 
  },
  recoveryHint: { 
    ...Typography.labelMicro, 
    color: Palette.accent, 
    marginTop: Spacing.xs, 
    opacity: 0.6 
  },
  perforation: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 32, 
    backgroundColor: Palette.paper,
    overflow: 'visible',
    paddingVertical: Spacing.xs,
  },
  perforationSmall: { 
    height: 24,
    paddingVertical: Spacing.xxxs,
  },
  dashLine: { 
    flex: 1, 
    height: 1, 
    borderBottomWidth: 1, 
    borderBottomColor: Palette.border, 
    borderStyle: 'dashed', 
    marginHorizontal: Spacing.lg, 
    opacity: 0.4,
  },
  notch: { 
    width: Spacing.xl, 
    height: Spacing.xl, 
    borderRadius: BorderRadius.xl, 
    backgroundColor: Palette.background, 
    position: 'absolute',
    top: '50%',
    marginTop: -(Spacing.xl / 2),
  },
  notchSmall: { 
    width: Spacing.lg, 
    height: Spacing.lg, 
    borderRadius: BorderRadius.lg,
    marginTop: -(Spacing.lg / 2),
  },
  notchLeft: { 
    left: -(Spacing.xl / 2),
  },
  notchRight: { 
    right: -(Spacing.xl / 2),
  },
  infoSection: { 
    padding: Spacing.xl, 
    paddingTop: Spacing.xs,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 160,
  },
  infoSectionSmall: { 
    padding: Spacing.md, 
    paddingTop: 0,
    minHeight: 120,
  },
  infoSectionExport: { 
    padding: Spacing.xxl,
    minHeight: 180,
  },
  infoHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: Spacing.md,
  },
  titleWrapper: { 
    flex: 1,
    marginRight: Spacing.md,
  },
  metaLabel: { 
    ...Typography.label, 
    fontSize: 9, 
    marginBottom: 4, 
    color: Palette.accent 
  },
  metaLabelSmall: { 
    ...Typography.labelSmall 
  },
  title: { 
    ...Typography.titleDetail,
    numberOfLines: 2,
    flexWrap: 'wrap',
  },
  titleSmall: { 
    ...Typography.titleCard,
    numberOfLines: 1,
    flexWrap: 'wrap',
  },
  note: { 
    ...Typography.subtitleCard, 
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    borderTopWidth: 1, 
    borderTopColor: Palette.borderTransparentMedium, 
    paddingTop: Spacing.md,
    marginTop: 'auto',
  },
  footerSmall: { 
    paddingTop: Spacing.xs,
    marginTop: Spacing.xs,
  },
  footerItem: { 
    flex: 1,
    minHeight: 40,
  },
  footerLabel: { 
    ...Typography.labelMicro, 
    marginBottom: 2 
  },
  footerValue: { 
    ...Typography.footerValueDetail, 
    color: Palette.primary 
  },
  footerValueSmall: { 
    ...Typography.monoSmall 
  },
  alignRight: { 
    alignItems: 'flex-end' 
  },
  barcode: { 
    flexDirection: 'row', 
    height: 24, 
    gap: Spacing.xxxs, 
    opacity: 0.12, 
    alignItems: 'center', 
    marginLeft: Spacing.md,
  },
  barcodeBar: { 
    height: '100%', 
    backgroundColor: Palette.primary 
  },
  bottomShadow: { 
    position: 'absolute', 
    bottom: -Spacing.xxxxs, 
    left: Spacing.lg, 
    right: Spacing.lg, 
    height: Spacing.lg, 
    backgroundColor: Palette.secondary, 
    borderRadius: BorderRadius.lg, 
    zIndex: 1, 
    opacity: 0.15 
  },
  backBody: { 
    padding: Spacing.xl, 
    backgroundColor: Palette.paperBack,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 320,
  },
  backHeader: { 
    marginBottom: Spacing.md,
    minHeight: 40,
  },
  backHeaderLabel: { 
    ...Typography.backHeaderLabel 
  },
  backHeaderDivider: { 
    height: 1, 
    backgroundColor: Palette.border, 
    marginTop: Spacing.xs, 
    width: '30%', 
    opacity: 0.5 
  },
  backContent: { 
    flex: 1,
    minHeight: 100,
    marginVertical: Spacing.md,
  },
  backContentInner: { 
    paddingBottom: Spacing.md,
  },
  backNoteText: { 
    ...Typography.backNote,
    lineHeight: 26,
  },
  backFooter: { 
    marginTop: Spacing.lg,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    paddingTop: Spacing.lg, 
    borderTopWidth: 1, 
    borderTopColor: Palette.borderTransparentLight,
    minHeight: 50,
  },
  stampContainer: { 
    alignItems: 'center', 
    opacity: 0.4 
  },
  stampText: { 
    ...Typography.labelMicro, 
    marginTop: 4 
  },
  backMeta: { 
    alignItems: 'flex-end' 
  },
  backLabel: { 
    ...Typography.monoMicro 
  },
});

export default memo(MemoryTicket);
