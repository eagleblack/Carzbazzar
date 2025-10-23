import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { COLORS } from '../styles/colors';
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const OTPVerificationScreen = ({ route, navigation }) => {
  const { cphoneNumber: phoneNumber, confirmation } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [confirmObj, setConfirmObj] = useState(confirmation);

  const inputRefs = useRef([]);

  // Timer countdown
  useEffect(() => {
    let timer;
    if (!canResend) {
      timer = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [canResend]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode = null) => {
    const codeToVerify = otpCode || otp.join('');

    if (codeToVerify.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);

      const userCredential = await confirmObj.confirm(codeToVerify);
      const { uid, phoneNumber } = userCredential.user;

      const userDocRef = firestore().collection("users").doc(uid);
      const userDoc = await userDocRef.get();
      
      if (userDoc.data()) {
       
        if (userData?.firstName) {
          navigation.replace("MainApp");
        } else {
          navigation.replace("PersonalDetails");
        }
      } else {
        await userDocRef.set({
          uid,
          phoneNumber,
          userType: "dealer",
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        navigation.replace("PersonalDetails");
      }

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.error("OTP verification error:", err);
      Alert.alert("Error", "Invalid or expired OTP. Please try again.");
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    try {
      setCanResend(false);
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);

      // Send new OTP
      const newConfirmation = await auth().signInWithPhoneNumber(phoneNumber);
      setConfirmObj(newConfirmation);

      Alert.alert('OTP Sent', 'A new OTP has been sent to your phone number');
    } catch (err) {
      console.error("Resend OTP error:", err);
      Alert.alert("Error", "Could not resend OTP. Please try again.");
      setCanResend(true);
    }
  };

  const formatPhoneNumber = (phone) => {
    return `+91 ${phone.slice(0, 5)}***${phone.slice(-2)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../assest/CarsBazarlogo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Verify Phone Number</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit OTP to{'\n'}
            <Text style={styles.phoneNumber}>{formatPhoneNumber(phoneNumber)}</Text>
          </Text>
        </View>

        {/* OTP Inputs */}
        <View style={styles.otpSection}>
          <Text style={styles.label}>Enter OTP</Text>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => inputRefs.current[index] = ref}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(key, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
          onPress={() => handleVerifyOTP()}
          disabled={isLoading}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Text>
        </TouchableOpacity>

        {/* Resend Section */}
        <View style={styles.resendSection}>
          <Text style={styles.resendText}>Didn't receive the OTP?</Text>
          <TouchableOpacity onPress={handleResendOTP} disabled={!canResend}>
            <Text style={[
              styles.resendButton,
              !canResend && styles.resendButtonDisabled
            ]}>
              {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Change Number */}
        <TouchableOpacity
          style={styles.changeNumberContainer}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.changeNumberText}>Change Phone Number</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffcef',
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
    width: 100,
    height: 65,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.subText,
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneNumber: {
    fontWeight: '600',
    color: COLORS.text,
  },
  otpSection: {
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 30,
  },
  verifyButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.subText,
    marginBottom: 8,
  },
  resendButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  resendButtonDisabled: {
    color: COLORS.gray,
  },
  changeNumberContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  changeNumberText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default OTPVerificationScreen;
