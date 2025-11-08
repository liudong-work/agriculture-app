import React from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text } from 'react-native-paper';

import type { ActivityBanner } from '../types/product';

type BannerCarouselProps = {
  data: ActivityBanner[];
  onPressBanner?: (banner: ActivityBanner) => void;
};

export default function BannerCarousel({ data, onPressBanner }: BannerCarouselProps) {
  const { width } = useWindowDimensions();

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    >
      {data.map((banner) => (
        <TouchableOpacity
          key={banner.id}
          activeOpacity={0.85}
          style={[styles.card, { width: width - 32 }]}
          onPress={() => onPressBanner?.(banner)}
        >
          <ImageBackground
            source={{ uri: banner.image }}
            style={styles.image}
            imageStyle={styles.imageStyle}
          >
            <View style={styles.overlay}>
              <Text variant="titleLarge" style={styles.title}>
                {banner.title}
              </Text>
              {banner.subtitle ? (
                <Text variant="bodyMedium" style={styles.subtitle}>
                  {banner.subtitle}
                </Text>
              ) : null}
            </View>
          </ImageBackground>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  card: {
    height: 180,
    marginRight: 12,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderRadius: 16,
  },
  overlay: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  title: {
    color: '#fff',
    fontWeight: '600',
  },
  subtitle: {
    color: '#fff',
    marginTop: 6,
  },
});

