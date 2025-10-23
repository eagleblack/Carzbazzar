import React, { useState } from "react";
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
} from "react-native";
import { useDispatch } from "react-redux";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { COLORS } from "../styles/colors";
import { setUser } from "../redux/userSlice";

const InspectionLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();

  const handleInspectionLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Information", "Please enter both email and password");
      return;
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Invalid Password", "Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      // ✅ Sign in with Firebase
      const userCred = await auth().signInWithEmailAndPassword(email, password);
      const uid = userCred.user.uid;

      // ✅ Fetch Firestore user doc
      const doc = await firestore().collection("users").doc(uid).get();

      if (!doc.exists) {
        setIsLoading(false);
        Alert.alert("User Not Found", "No inspector profile found for this account.");
        return;
      }

      const userData = doc.data();

      if (userData.userType !== "inspector") {
        setIsLoading(false);
        Alert.alert("Access Denied", "This login is only for inspector accounts.");
        return;
      }

      // ✅ Save to Redux
      dispatch(setUser(userData));

      // ✅ Navigate to inspector screen
   
      console.log("Inspector login successful:", userData.email);
    } catch (err) {
      console.error("Inspection login failed:", err);
      Alert.alert("Login Failed", err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../assest/CarsBazarlogo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Inspection Manager</Text>
            <Text style={styles.subtitle}>
              Enter your credentials to access the inspection portal
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                placeholderTextColor={COLORS.gray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.gray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeButtonText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Sign In */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleInspectionLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          {/* Back */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to Main Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffcef" },
  keyboardContainer: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  header: { marginBottom: 40, alignItems: "center" },
  logo: { width: 120, height: 80, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: COLORS.text, marginBottom: 8 },
  subtitle: {
    fontSize: 16,
    color: COLORS.subText,
    textAlign: "center",
    lineHeight: 22,
  },
  formContainer: { marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", color: COLORS.text, marginBottom: 8 },
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
  passwordContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeButton: { paddingHorizontal: 16, paddingVertical: 16 },
  eyeButtonText: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonDisabled: { backgroundColor: COLORS.gray },
  loginButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
  backButton: { alignItems: "center", paddingVertical: 12 },
  backButtonText: {
    color: COLORS.subText,
    fontSize: 16,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});

export default InspectionLoginScreen;
