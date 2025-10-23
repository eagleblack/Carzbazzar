import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { COLORS, SHADOWS } from '../styles/colors';
import auth from "@react-native-firebase/auth";

const PhoneLoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phoneNumber) return;
    const cphoneNumber = `+91${phoneNumber}`;
    try {
      setIsLoading(true);
      const confirmation = await auth().signInWithPhoneNumber(cphoneNumber);
      setIsLoading(false);
      navigation.navigate("OTPVerification", {
        cphoneNumber,
        confirmation,
      });
    } catch (err) {
      setIsLoading(false);
      console.error("Error sending OTP:", err);
    }
  };


  const handleInspectionLogin = () => {
    navigation.navigate('InspectionLogin');
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.content}>
          {/* Header with Logo */}
          <View style={styles.header}>
            <Image 
              source={require('../assest/CarsBazarlogo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome to Carsbazar</Text>
            <Text style={styles.subtitle}>Enter your phone number to continue</Text>
          </View>

          {/* Phone Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.gray}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          {/* Send OTP Button */}
          <TouchableOpacity
            style={[styles.otpButton, isLoading && styles.otpButtonDisabled]}
            onPress={handleSendOtp}
            disabled={isLoading}
          >
            <Text style={styles.otpButtonText}>
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </Text>
          </TouchableOpacity>

          {/* Inspection Login Button */}
          <TouchableOpacity
            style={styles.inspectionLoginButton}
            onPress={handleInspectionLogin}
          >
            <Text style={styles.inspectionLoginButtonText}>Inspection Login</Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.linkText} onPress={() => navigation.navigate('TermsOfService')}>
              Terms of Service
            </Text> and{' '}
            <Text style={styles.linkText} onPress={() => navigation.navigate('PrivacyPolicy')}>
              Privacy Policy
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffcef',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 50,
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.subText,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    color: COLORS.text,
  },
  otpButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  otpButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  otpButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 14,
    color: COLORS.subText,
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  inspectionLoginButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  inspectionLoginButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PhoneLoginScreen;
