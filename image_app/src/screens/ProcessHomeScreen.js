import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../auth';
import { COLORS, FONT_FAMILY, RADII, SHADOWS, useResponsive } from '../theme';
import {
  Card,
  EmptyState,
  PageContainer,
  StatusPill,
} from '../components/ui';

export default function ProcessHomeScreen({ navigation }) {
  const { token } = useAuth();
  const [recent, setRecent] = useState([]);
  const { isDesktop } = useResponsive();

  useFocusEffect(
    useCallback(() => {
      api.recentProcess(token).then((r) => setRecent(r.data || [])).catch(() => {});
    }, [token])
  );

  const pickGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
      mediaTypes: ['images'],
    });
    if (result.canceled) return;
    navigation.navigate('ProcessWizard', {
      assets: result.assets.map((asset) => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      })),
      step: 1,
    });
  };

  const webHeroGrad =
    Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(125deg, #E4F4E7 0%, #EEF6EE 60%, #F7EFE2 100%)',
        }
      : null;

  return (
    <PageContainer>
      {/* Hero Banner */}
      <View style={[styles.hero, webHeroGrad]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>
            Process Product Images with Perfect Background
          </Text>
          <Text style={styles.heroSub}>
            Select gallery photos or search catalog products, then composite onto Background Master.
          </Text>
        </View>
        <View style={styles.heroBadge}>
          <Ionicons name="color-wand-outline" size={32} color={COLORS.primary} />
        </View>
      </View>

      {/* Source Cards */}
      <View style={[styles.cardsRow, isDesktop && { flexDirection: 'row' }]}>
        <Pressable
          onPress={pickGallery}
          style={({ pressed }) => [
            styles.sourceCard,
            isDesktop && { flex: 1 },
            pressed && { opacity: 0.88 },
          ]}
        >
          <View style={[styles.sourceIcon, { backgroundColor: COLORS.tileGreen }]}>
            <Ionicons name="images-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sourceTitle}>Select Images From Gallery</Text>
            <Text style={styles.sourceSub}>
              Browse gallery or camera in the next step
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('SearchImages')}
          style={({ pressed }) => [
            styles.sourceCard,
            isDesktop && { flex: 1 },
            pressed && { opacity: 0.88 },
          ]}
        >
          <View style={[styles.sourceIcon, { backgroundColor: COLORS.tileBlue }]}>
            <Ionicons name="cube-outline" size={24} color="#1D6FA5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sourceTitle}>Select Images From Product Master</Text>
            <Text style={styles.sourceSub}>
              By category, sub-category, product
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Recent Processing</Text>
      {recent.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="No recent processing"
          subtitle="Your recently processed batches will show up here."
        />
      ) : (
        <View style={styles.recentList}>
          {recent.map((row) => (
            <Card key={row.id} style={styles.recentCard}>
              <View style={styles.recentIcon}>
                <Ionicons name="checkmark-done-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentCount}>{row.image_count} images</Text>
                <Text style={styles.recentDate}>{row.processed_at}</Text>
              </View>
              <StatusPill label="Processed" />
            </Card>
          ))}
        </View>
      )}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: COLORS.tileGreen,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: '#D5EAD8',
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...SHADOWS.soft,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    lineHeight: 26,
    fontFamily: FONT_FAMILY,
  },
  heroSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
    lineHeight: 19,
    fontFamily: FONT_FAMILY,
  },
  heroBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsRow: {
    gap: 12,
    marginBottom: 20,
  },
  sourceCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 76,
    ...SHADOWS.soft,
  },
  sourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  sourceSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 12,
    fontFamily: FONT_FAMILY,
  },
  recentList: {
    gap: 10,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentCount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONT_FAMILY,
  },
  recentDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
});
