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

const PrivacyPolicyScreen = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
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

            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.paragraph}>
              We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
            </Text>
            <Text style={styles.subsectionTitle}>Personal Information:</Text>
            <Text style={styles.bulletPoint}>• Name and contact information (phone number, email address)</Text>
            <Text style={styles.bulletPoint}>• Address and location information</Text>
            <Text style={styles.bulletPoint}>• Company information (if applicable)</Text>
            <Text style={styles.bulletPoint}>• GST number and business details</Text>

            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
            <Text style={styles.paragraph}>
              We use the information we collect to:
            </Text>
            <Text style={styles.bulletPoint}>• Provide, maintain, and improve our services</Text>
            <Text style={styles.bulletPoint}>• Process transactions and send related information</Text>
            <Text style={styles.bulletPoint}>• Send technical notices, updates, security alerts, and support messages</Text>
            <Text style={styles.bulletPoint}>• Respond to your comments, questions, and requests</Text>
            <Text style={styles.bulletPoint}>• Communicate with you about products, services, and promotional offers</Text>

            <Text style={styles.sectionTitle}>3. Information Sharing and Disclosure</Text>
            <Text style={styles.paragraph}>
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:
            </Text>
            <Text style={styles.bulletPoint}>• With your explicit consent</Text>
            <Text style={styles.bulletPoint}>• To comply with legal obligations</Text>
            <Text style={styles.bulletPoint}>• To protect our rights, property, or safety</Text>
            <Text style={styles.bulletPoint}>• With service providers who assist us in operating our app</Text>

            <Text style={styles.sectionTitle}>4. Data Security</Text>
            <Text style={styles.paragraph}>
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
            </Text>

            <Text style={styles.sectionTitle}>5. Data Retention</Text>
            <Text style={styles.paragraph}>
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </Text>

            <Text style={styles.sectionTitle}>6. Your Rights</Text>
            <Text style={styles.paragraph}>
              You have the right to:
            </Text>
            <Text style={styles.bulletPoint}>• Access and update your personal information</Text>
            <Text style={styles.bulletPoint}>• Request deletion of your personal information</Text>
            <Text style={styles.bulletPoint}>• Object to the processing of your personal information</Text>
            <Text style={styles.bulletPoint}>• Request data portability</Text>
            <Text style={styles.bulletPoint}>• Withdraw consent at any time</Text>

            <Text style={styles.sectionTitle}>7. Cookies and Tracking</Text>
            <Text style={styles.paragraph}>
              Our app may use cookies and similar tracking technologies to enhance your experience. You can control cookie settings through your device preferences.
            </Text>

            <Text style={styles.sectionTitle}>8. Third-Party Services</Text>
            <Text style={styles.paragraph}>
              Our app may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
            </Text>

            <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
            <Text style={styles.paragraph}>
              Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </Text>

            <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
            <Text style={styles.paragraph}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </Text>

            <Text style={styles.contactTitle}>Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have any questions about this Privacy Policy, please contact us:
            </Text>
            <Text style={styles.contactInfo}>Email: privacy@carsbazar.com</Text>
            <Text style={styles.contactInfo}>Phone: +91-XXXX-XXXX-XX</Text>
            <Text style={styles.contactInfo}>Address: CarsLelo Technologies, India</Text>

            <Text style={styles.legalNote}>
              This Privacy Policy is governed by the laws of India and is subject to the jurisdiction of Indian courts.
            </Text>
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
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 10,
    marginBottom: 8,
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
  legalNote: {
    fontSize: 14,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PrivacyPolicyScreen;
