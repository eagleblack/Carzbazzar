import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import messaging from "@react-native-firebase/messaging";
import { COLORS } from "../styles/colors";
import { saveFcmToken } from "../utils/saveFcmToken";

const PersonalDetailsScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    companyName: "",
    gstNumber: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "address",
      "city",
      "state",
      "pincode",
    ];
    for (let field of requiredFields) {
      if (!formData[field]?.trim()) {
        Alert.alert("Missing Information", `Please enter your ${field}`);
        return false;
      }
    }
    if (!/^\d{6}$/.test(formData.pincode)) {
      Alert.alert("Invalid Pincode", "Pincode must be a 6-digit number");
      return false;
    }
    return true;
  };

  function unique4Digit() {
    const ts = Date.now();
    return ts.toString().slice(-4);
  }

  const requestNotificationPermission = async (userId) => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        await saveFcmToken(userId);
      } else {
        console.log("Notifications permission denied");
      }
    } catch (err) {
      console.error("Notification permission error:", err);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const currentUser = auth().currentUser;

      if (!currentUser) {
        Alert.alert("Error", "No authenticated user found");
        setIsLoading(false);
        return;
      }

      const userDocRef = firestore().collection("users").doc(currentUser.uid);

      await userDocRef.set(
        {
          ...formData,
          uid: currentUser.uid,
          phoneNumber: currentUser.phoneNumber,
          updatedAt: firestore.FieldValue.serverTimestamp(),
          userType: "dealer",
          id: unique4Digit(),
        },
        { merge: true }
      );

      // ✅ Ask notification permission and save FCM token
      await requestNotificationPermission(currentUser.uid);

      setIsLoading(false);
      navigation.replace("MainApp");
    } catch (err) {
      console.error("Error saving user details:", err);
      Alert.alert("Error", "Something went wrong while saving your details.");
      setIsLoading(false);
    }
  };

  const inputFields = [
    { key: "firstName", label: "First Name", placeholder: "Enter your first name", required: true },
    { key: "lastName", label: "Last Name", placeholder: "Enter your last name", required: true },
    { key: "email", label: "Email Address", placeholder: "Enter your email", required: true, keyboardType: "email-address" },
    { key: "address", label: "Address", placeholder: "Enter your address", required: true, multiline: true },
    { key: "city", label: "City", placeholder: "Enter your city", required: true },
    { key: "state", label: "State", placeholder: "Enter your state", required: true },
    { key: "pincode", label: "Pincode", placeholder: "Enter pincode", required: true, keyboardType: "numeric", maxLength: 6 },
    { key: "companyName", label: "Company Name", placeholder: "Enter company name (optional)", required: false },
    { key: "gstNumber", label: "GST Number", placeholder: "Enter GST number (optional)", required: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../assest/CarsBazarlogo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Please provide your personal details to continue
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {inputFields.map((field) => (
              <View key={field.key} style={styles.inputGroup}>
                <Text style={styles.label}>
                  {field.label}
                  {field.required && <Text style={styles.required}> *</Text>}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    field.multiline && styles.multilineInput,
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={COLORS.gray}
                  value={formData[field.key]}
                  onChangeText={(value) => handleInputChange(field.key, value)}
                  keyboardType={field.keyboardType || "default"}
                  maxLength={field.maxLength}
                  multiline={field.multiline}
                  numberOfLines={field.multiline ? 3 : 1}
                />
              </View>
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? "Saving Details..." : "Complete Registration"}
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            By continuing, you agree to our{" "}
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate("TermsOfService")}
            >
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate("PrivacyPolicy")}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffcef" },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  header: { marginBottom: 30, alignItems: "center" },
  logo: { width: 120, height: 80, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: COLORS.text, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: COLORS.subText, textAlign: "center", lineHeight: 22 },
  formContainer: { marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", color: COLORS.text, marginBottom: 8 },
  required: { color: COLORS.error },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  multilineInput: { height: 80, textAlignVertical: "top" },
  submitButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 18, alignItems: "center", marginBottom: 24 },
  submitButtonDisabled: { backgroundColor: COLORS.gray },
  submitButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
  termsText: { fontSize: 14, color: COLORS.subText, textAlign: "center", lineHeight: 20 },
  linkText: { color: COLORS.primary, fontWeight: "500" },
});

export default PersonalDetailsScreen;
