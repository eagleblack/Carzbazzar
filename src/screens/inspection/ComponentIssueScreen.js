import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../styles/colors";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useDispatch } from "react-redux";
import { uuidv4 } from "../../utils/uuid";
import { addImageLocal, processUploadQueue } from "../../redux/inspectionSlice";

const ComponentIssueScreen = ({ navigation, route }) => {
  const {
    componentName,
    componentKey,
    tabName,
    inspectionId,
    onIssueSaved,
    onCancel,
    type,
  } = route.params || {};

  const dispatch = useDispatch();
  const [reason, setReason] = useState("");
  const [mediaUri, setMediaUri] = useState(null);

  const isVideo = type === "video";

  const saveMediaPermanently = async (uri, inspectionId, sectionKey, id, isVideo) => {
    const ext = isVideo ? "mp4" : "jpg";
    const newPath = `${FileSystem.documentDirectory}${inspectionId}_${sectionKey}_${id}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: newPath });
    return newPath;
  };

  const handleTakeMedia = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraPermission.status !== "granted" || mediaPermission.status !== "granted") {
        Alert.alert("Permission Denied", "Camera & storage permission is required.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: isVideo
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
        quality: isVideo ? 1 : 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setMediaUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log("Media capture error:", err);
      Alert.alert("Error", "Could not open camera: " + err.message);
    }
  };

  const handleSave = async () => {
    if (!reason.trim()) {
      Alert.alert("Required", "Please provide a reason for the issue.");
      return;
    }

    // ✅ If choice, just send "No" (no media required)
    if (type === "choice") {
      if (onIssueSaved) {
        onIssueSaved({
          componentName,
          componentKey,
          tabName,
          reason,
          localPath: null,
          type,
          remark: "No", // always mark as "No" here
          timestamp: new Date().toISOString(),
        });
      }

      Alert.alert("Success", "Issue recorded successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
      return;
    }

    // ✅ For image/video, require evidence
    if (!mediaUri) {
      Alert.alert(
        "Required",
        `Please ${isVideo ? "record a video" : "take a photo"} of the issue.`
      );
      return;
    }

    try {
      const id = uuidv4();
      let localPath = null;

      // Save media locally
      localPath = await saveMediaPermanently(
        mediaUri,
        inspectionId,
        `${tabName}.${componentKey}`,
        id,
        isVideo
      );

      // Dispatch to redux
      dispatch(
        addImageLocal({
          inspectionId,
          image: {
            id,
            type: isVideo ? "video" : "image",
            localPath,
            sectionKey: `${tabName}.${componentKey}`,
            remark: reason || "",
          },
        })
      );

      dispatch(processUploadQueue());

      if (onIssueSaved) {
        onIssueSaved({
          componentName,
          componentKey,
          tabName,
          reason,
          localPath,
          type,
          remark: "No", // keep consistency with choice
          timestamp: new Date().toISOString(),
        });
      }

      Alert.alert("Success", "Issue recorded successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.log("Save issue error:", err);
      Alert.alert("Error", "Could not save issue: " + err.message);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Component Issue</Text>
          <Text style={styles.componentTitle}>{componentName}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.contentContainer}>
            {/* Component Info */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Component:</Text>
                <Text style={styles.infoValue}>{componentName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>{tabName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={[styles.infoValue, styles.issueStatus]}>
                  Issue Found
                </Text>
              </View>
            </View>

            {/* Media Section (skip if choice) */}
            {type !== "choice" && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Evidence</Text>
                <Text style={styles.sectionSubtitle}>
                  {isVideo ? "Record a video" : "Take a photo"} to document the issue
                </Text>

                <TouchableOpacity
                  style={[styles.photoButton, mediaUri && styles.photoButtonTaken]}
                  onPress={handleTakeMedia}
                >
                  <Ionicons
                    name={
                      mediaUri
                        ? "checkmark-circle"
                        : isVideo
                        ? "videocam"
                        : "camera"
                    }
                    size={32}
                    color={mediaUri ? "#10b981" : "#6b7280"}
                  />
                  <Text
                    style={[
                      styles.photoButtonText,
                      mediaUri && styles.photoButtonTextTaken,
                    ]}
                  >
                    {mediaUri
                      ? isVideo
                        ? "Video Captured"
                        : "Photo Taken"
                      : isVideo
                      ? "Record Video"
                      : "Take Photo"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Reason Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reason for Issue</Text>
              <Text style={styles.sectionSubtitle}>
                Please describe what issue was found with this component
              </Text>

             <TextInput
  style={styles.reasonInput}
  placeholder="Enter the reason for the issue..."
  placeholderTextColor="#9ca3af"
  value={reason}
  onChangeText={(text) => setReason(text.toUpperCase())} // forces uppercase
  multiline
  numberOfLines={6}
  textAlignVertical="top"
  autoCapitalize="characters"
/>

            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Issue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    backgroundColor: "#1e3a8a",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backButton: { marginRight: 16 },
  headerContent: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  componentTitle: { fontSize: 14, color: "#ffffff", opacity: 0.9 },
  headerRight: { width: 24 },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  contentContainer: { padding: 20 },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: { fontSize: 16, color: "#6b7280", fontWeight: "500" },
  infoValue: { fontSize: 16, color: "#374151", fontWeight: "600" },
  issueStatus: { color: "#ef4444" },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
  },
  sectionSubtitle: { fontSize: 14, color: "#6b7280", marginBottom: 16 },
  photoButton: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  photoButtonTaken: {
    borderColor: "#10b981",
    borderStyle: "solid",
    backgroundColor: "#f0fdf4",
  },
  photoButtonText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 8,
  },
  photoButtonTextTaken: { color: "#10b981" },
  reasonInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#374151",
    minHeight: 120,
  },
  buttonContainer: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: { fontSize: 16, color: "#6b7280", fontWeight: "600" },
  saveButton: {
    flex: 1,
    backgroundColor: "#1e3a8a",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: { fontSize: 16, color: "#ffffff", fontWeight: "bold" },
});

export default ComponentIssueScreen;
