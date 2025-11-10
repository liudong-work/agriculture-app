import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  View,
  Dimensions,
  FlatList,
} from 'react-native';
import { Text, Chip, Divider } from 'react-native-paper';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import type { HomeStackParamList } from '../navigation/AppNavigator';
import { fetchFarmerStory } from '../services/farmer.api';
import type { FarmerStoryEntry } from '../types/farmer';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = width * 0.56;

function StoryTimelineItem({ item }: { item: FarmerStoryEntry }) {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineDot} />
      <View style={styles.timelineContent}>
        <Text variant="titleMedium" style={styles.timelineTitle}>
          {item.title}
        </Text>
        <Text variant="bodySmall" style={styles.timelineTime}>
          {new Date(item.publishedAt).toLocaleString()}
        </Text>
        <Text variant="bodyMedium" style={styles.timelineDesc}>
          {item.content}
        </Text>
        {item.labels.length > 0 && (
          <View style={styles.labelRow}>
            {item.labels.map((label) => (
              <Chip key={label} style={styles.timelineChip} compact>
                {label}
              </Chip>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export default function FarmerStoryScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'FarmerStory'>>();
  const { farmerId, title } = route.params;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['farmer-story', farmerId],
    queryFn: () => fetchFarmerStory(farmerId),
  });

  if (isLoading) {
    return (
      <View style={styles.centeredBox}>
        <ActivityIndicator size="large" />
        <Text style={styles.centeredText}>正在加载农户故事...</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centeredBox}>
        <Text style={styles.errorText}>暂时无法获取农户故事，请稍后再试。</Text>
      </View>
    );
  }

  const { overview, stories } = data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {overview?.heroImage ? (
        <Image source={{ uri: overview.heroImage }} style={styles.heroImage} resizeMode="cover" />
      ) : (
        <View style={[styles.heroPlaceholder, styles.heroImage]}>
          <Text variant="headlineMedium" style={styles.placeholderText}>
            {overview?.farmName ?? title ?? '合作农户'}
          </Text>
        </View>
      )}

      <View style={styles.headerSection}>
        <Text variant="headlineSmall" style={styles.farmName}>
          {overview?.farmName ?? title ?? '合作农户' }
        </Text>
        {overview?.region && (
          <Chip icon="map-marker" style={styles.regionChip} compact>
            {overview.region}
          </Chip>
        )}
        {overview?.storyHeadline && (
          <Text variant="titleMedium" style={styles.storyHeadline}>
            {overview.storyHeadline}
          </Text>
        )}
        {overview?.storyHighlights && overview.storyHighlights.length > 0 && (
          <View style={styles.highlightRow}>
            {overview.storyHighlights.map((highlight) => (
              <Chip key={highlight} style={styles.highlightChip} textStyle={styles.highlightChipText}>
                {highlight}
              </Chip>
            ))}
          </View>
        )}
      </View>

      {overview?.storyContent && (
        <View style={styles.sectionBox}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            田间到餐桌
          </Text>
          <Text variant="bodyMedium" style={styles.sectionText}>
            {overview.storyContent}
          </Text>
        </View>
      )}

      {overview?.storyGallery && overview.storyGallery.length > 0 && (
        <View style={styles.sectionBox}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            图片故事
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryRow}>
            {overview.storyGallery.map((item) => (
              <View key={item.url} style={styles.galleryItem}>
                <Image source={{ uri: item.url }} style={styles.galleryImage} resizeMode="cover" />
                {item.caption && (
                  <Text style={styles.galleryCaption}>{item.caption}</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {overview?.certifications && overview.certifications.length > 0 && (
        <View style={styles.sectionBox}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            认证资质
          </Text>
          {overview.certifications.map((item, index) => (
            <View key={`${item.title}-${index}`} style={styles.certItem}>
              <Text variant="bodyLarge" style={styles.certTitle}>
                {item.title}
              </Text>
              <Text variant="bodySmall" style={styles.certMeta}>
                {item.issuer ?? '认证机构未填写'} · {item.issuedAt ?? '日期未知'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Divider style={styles.divider} />

      <View style={styles.sectionBox}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          溯源日记
        </Text>
        {stories.length === 0 ? (
          <Text style={styles.emptyText}>农户还在准备图文故事，敬请期待。</Text>
        ) : (
          <FlatList
            data={stories}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => <StoryTimelineItem item={item} />}
            ItemSeparatorComponent={() => <View style={styles.timelineSeparator} />}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9f6',
  },
  content: {
    paddingBottom: 32,
  },
  heroImage: {
    width,
    height: HERO_HEIGHT,
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbe4c6',
  },
  placeholderText: {
    color: '#4a6a49',
    fontWeight: '600',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  farmName: {
    fontWeight: '700',
    color: '#2e5436',
  },
  regionChip: {
    marginTop: 12,
    backgroundColor: '#e1f5fe',
  },
  storyHeadline: {
    marginTop: 16,
    color: '#1b5e20',
  },
  highlightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  highlightChip: {
    backgroundColor: '#e8f5e9',
  },
  highlightChipText: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  sectionBox: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
    color: '#2e5436',
  },
  sectionText: {
    lineHeight: 22,
    color: '#44524a',
  },
  galleryRow: {
    flexGrow: 0,
  },
  galleryItem: {
    marginRight: 12,
    width: width * 0.6,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  galleryImage: {
    width: '100%',
    height: width * 0.36,
  },
  galleryCaption: {
    padding: 10,
    color: '#455a64',
  },
  certItem: {
    paddingVertical: 10,
  },
  certTitle: {
    fontWeight: '600',
  },
  certMeta: {
    marginTop: 4,
    color: '#607d8b',
  },
  divider: {
    marginHorizontal: 20,
    marginTop: 30,
  },
  emptyText: {
    color: '#90a4ae',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#81c784',
    marginRight: 12,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontWeight: '600',
    color: '#1b5e20',
  },
  timelineTime: {
    marginTop: 4,
    color: '#78909c',
  },
  timelineDesc: {
    marginTop: 8,
    color: '#546e7a',
    lineHeight: 20,
  },
  labelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  timelineChip: {
    backgroundColor: '#f1f8e9',
  },
  timelineSeparator: {
    height: 24,
  },
  centeredBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centeredText: {
    marginTop: 12,
    color: '#607d8b',
  },
  errorText: {
    color: '#d32f2f',
  },
});
