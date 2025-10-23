import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../styles/colors';

const TermsOfServiceScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assest/CarsBazarlogo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Content */}
          <View style={styles.textContainer}>
            <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>

            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By accessing and using the Carsbazar mobile application ("App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </Text>

            <Text style={styles.sectionTitle}>2. Use License</Text>
            <Text style={styles.paragraph}>
              Permission is granted to temporarily download one copy of the Carsbazar app for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </Text>
            <Text style={styles.bulletPoint}>• Modify or copy the materials</Text>
            <Text style={styles.bulletPoint}>• Use the materials for any commercial purpose or for any public display</Text>
            <Text style={styles.bulletPoint}>• Attempt to reverse engineer any software contained in the app</Text>
            <Text style={styles.bulletPoint}>• Remove any copyright or other proprietary notations from the materials</Text>

            <Text style={styles.sectionTitle}>3. User Accounts</Text>
            <Text style={styles.paragraph}>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
            </Text>

            <Text style={styles.sectionTitle}>4. Privacy Policy</Text>
            <Text style={styles.paragraph}>
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the App, to understand our practices.
            </Text>

            <Text style={styles.sectionTitle}>5. Prohibited Uses</Text>
            <Text style={styles.paragraph}>
              You may not use our App:
            </Text>
            <Text style={styles.bulletPoint}>• For any unlawful purpose or to solicit others to perform unlawful acts</Text>
            <Text style={styles.bulletPoint}>• To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</Text>
            <Text style={styles.bulletPoint}>• To infringe upon or violate our intellectual property rights or the intellectual property rights of others</Text>
            <Text style={styles.bulletPoint}>• To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</Text>

            <Text style={styles.sectionTitle}>6. Content</Text>
            <Text style={styles.paragraph}>
              Our App allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post to the App, including its legality, reliability, and appropriateness.
            </Text>

            <Text style={styles.sectionTitle}>7. Termination</Text>
            <Text style={styles.paragraph}>
              We may terminate or suspend your account and bar access to the App immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </Text>

            <Text style={styles.sectionTitle}>8. Disclaimer</Text>
            <Text style={styles.paragraph}>
              The information on this App is provided on an "as is" basis. To the fullest extent permitted by law, this Company excludes all representations, warranties, conditions and terms relating to our App and the use of this App.
            </Text>

            <Text style={styles.sectionTitle}>9. Governing Law</Text>
            <Text style={styles.paragraph}>
              These Terms shall be interpreted and governed by the laws of India, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </Text>

            <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
            <Text style={styles.paragraph}>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
            </Text>

            <Text style={styles.contactTitle}>Contact Information</Text>
            <Text style={styles.paragraph}>
              If you have any questions about these Terms of Service, please contact us at:
            </Text>
            <Text style={styles.contactInfo}>Email: support@carsbazar.com</Text>
            <Text style={styles.contactInfo}>Phone: +91-XXXX-XXXX-XX</Text>
            <Text style={styles.contactInfo}>Address: CarsLelo Technologies, India</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffcef',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 65,
  },
  textContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 15,
  },
  bulletPoint: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginLeft: 10,
    marginBottom: 8,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 30,
    marginBottom: 10,
  },
  contactInfo: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 5,
  },
});

export default TermsOfServiceScreen;
