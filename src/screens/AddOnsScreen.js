import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../styles/colors';

const AddOnsScreen = () => {
  const addOns = [
    {
      id: 1,
      title: 'Extended Warranty',
      description: 'Protect your car with extended warranty coverage',
      price: '₹15,000',
      icon: 'shield-checkmark-outline',
    },
    {
      id: 2,
      title: 'Car Insurance',
      description: 'Comprehensive car insurance packages',
      price: '₹8,500',
      icon: 'car-outline',
    },
    {
      id: 3,
      title: 'Roadside Assistance',
      description: '24/7 roadside assistance and emergency support',
      price: '₹3,000',
      icon: 'call-outline',
    },
    {
      id: 4,
      title: 'Car Accessories',
      description: 'Premium car accessories and modifications',
      price: '₹5,000',
      icon: 'settings-outline',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Ons</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Enhance your car buying experience</Text>
          
          {addOns.map((addOn) => (
            <TouchableOpacity key={addOn.id} style={styles.addOnCard}>
              <View style={styles.addOnIcon}>
                <Ionicons name={addOn.icon} size={24} color={COLORS.primary} />
              </View>
              
              <View style={styles.addOnInfo}>
                <Text style={styles.addOnTitle}>{addOn.title}</Text>
                <Text style={styles.addOnDescription}>{addOn.description}</Text>
                <Text style={styles.addOnPrice}>Starting from {addOn.price}</Text>
              </View>
              
              <View style={styles.addOnArrow}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  addOnCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  addOnIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  addOnDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
    lineHeight: 20,
  },
  addOnPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  addOnArrow: {
    padding: 8,
  },
});

export default AddOnsScreen;
