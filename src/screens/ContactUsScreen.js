import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { COLORS, SHADOWS } from "../styles/colors";
import { useSelector } from "react-redux";

const ContactUsScreen = ({ navigation }) => {
  const currentUser = auth().currentUser;
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState([]);
  const userData = useSelector((state) => state.user.user) || {
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    companyName: '',
    gstNumber: '',
    phoneNumber: '',
    uid: '',
  };
  // 🔹 Fetch user issues from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = firestore()
      .collection("issues")
      .where("uid", "==", currentUser.uid)
      .orderBy("createdOn", "desc")
      .onSnapshot(
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setIssues(data);
        },
        (error) => {
          console.error("Error fetching issues:", error);
        }
      );

    return () => unsubscribe();
  }, [currentUser]);

  // 🔹 Submit issue
  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert("Error", "Please enter a message.");
      return;
    }

    try {
      setLoading(true);
      await firestore().collection("issues").add({
        userData,
        uid: currentUser.uid,
        message: message.trim(),
        createdOn: firestore.FieldValue.serverTimestamp(),
        status: "pending",
      });
      setMessage("");
      Alert.alert("Success", "Your issue has been submitted.");
    } catch (err) {
      console.error("Submit error:", err);
      Alert.alert("Error", "Failed to submit issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Input Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Enter your message</Text>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your issue here..."
          multiline
        />
        <TouchableOpacity
          style={[styles.submitButton, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Issues List */}
      <Text style={styles.sectionTitle}>My Issues</Text>
      <FlatList
        data={issues}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No issues submitted yet.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.issueCard}>
            <Text style={styles.issueMessage}>{item.message}</Text>
            <Text style={styles.issueMeta}>
              Status:{" "}
              <Text
                style={{
                  color: item.status === "pending" ? "orange" : "green",
                  fontWeight: "600",
                }}
              >
                {item.status}
              </Text>
            </Text>
            <Text style={styles.issueMeta}>
              {item.createdOn
                ? item.createdOn.toDate().toLocaleString()
                : "Just now"}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "600", color: COLORS.text },
  headerRight: { width: 40 },
  form: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    ...SHADOWS.small,
  },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 8, color: COLORS.text },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: { color: "white", fontSize: 16, fontWeight: "600" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    color: COLORS.text,
  },
  issueCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  issueMessage: { fontSize: 14, color: COLORS.text, marginBottom: 6 },
  issueMeta: { fontSize: 12, color: COLORS.gray },
});

export default ContactUsScreen;
