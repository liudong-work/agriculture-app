import React from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, Chip } from 'react-native-paper';

import type { ActivityCard } from '../types/product';

type ActivityHighlightProps = {
  data: ActivityCard[];
  onPressCard?: (card: ActivityCard) => void;
};

export default function ActivityHighlight({ data, onPressCard }: ActivityHighlightProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {data.map((card) => (
        <TouchableOpacity
          key={card.id}
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => onPressCard?.(card)}
        >
          <ImageBackground
            source={{ uri: card.image }}
            style={styles.image}
            imageStyle={styles.imageStyle}
          >
            <View style={styles.overlay}>
              {card.badge ? (
                <Chip compact style={styles.badge}>{card.badge}</Chip>
              ) : null}
              <Text variant="titleMedium" style={styles.title}>
                {card.title}
              </Text>
              <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
                {card.description}
              </Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  card: {
    width: 220,
    height: 160,
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
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  badge: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  title: {
    color: '#fff',
    fontWeight: '600',
  },
  description: {
    color: '#f5f5f5',
    marginTop: 6,
  },
});

