import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/colors';

const MyCarsScreen = () => {
  const [activeTab, setActiveTab] = useState('Live bid');

  const tabs = [
    { name: 'Live bid', count: 0 },
    { name: 'OCB nego', count: 0 },
    { name: 'Wishlist', count: 0 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cars</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.tab,
              activeTab === tab.name && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.name)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.name && styles.activeTabText
            ]}>
              {tab.name}
            </Text>
            <Text style={[
              styles.tabCount,
              activeTab === tab.name && styles.activeTabCount
            ]}>
              {tab.count}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Empty State */}
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateIcon}>
          <Image
            source={{ uri: 'https://via.placeholder.com/120x80?text=🔨' }}
            style={styles.hammerIcon}
          />
        </View>
        
        <Text style={styles.emptyStateTitle}>
          You haven't placed any bids, yet
        </Text>
        
        <Text style={styles.emptyStateSubtitle}>
          You are missing out on great deals.{'\n'}
          Browse now and start bidding!
        </Text>
        
        <TouchableOpacity style={styles.viewAuctionsButton}>
          <Text style={styles.viewAuctionsButtonText}>
            View all auctions
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginRight: 32,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.blue,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.gray,
    marginRight: 8,
  },
  activeTabText: {
    color: COLORS.blue,
    fontWeight: '600',
  },
  tabCount: {
    fontSize: 16,
    color: COLORS.gray,
  },
  activeTabCount: {
    color: COLORS.blue,
    fontWeight: '600',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    marginBottom: 32,
    alignItems: 'center',
  },
  hammerIcon: {
    width: 120,
    height: 80,
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  viewAuctionsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  viewAuctionsButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyCarsScreen;
