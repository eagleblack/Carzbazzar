import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { COLORS } from "../../styles/colors";
import {
  addImageLocal,
  processUploadQueue,
  saveSectionToFirestore,
} from "../../redux/inspectionSlice";
import { uuidv4 } from "../../utils/uuid";

const SECTION_NAME = "SteeringSuspensionBrakes";

const SteeringSuspensionBrakesInspection = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const inspectionParam = route.params?.inspection;
  const inspectionId = inspectionParam?.inspectionId;

  const inspection = useSelector((s) => s.inspections.byId[inspectionId]);
  const uploadQueue = useSelector((s) => s.inspections.uploadQueue);

  const [selectedOptions, setSelectedOptions] = useState({});

  const components = useMemo(
    () => [
      { key: "steering", label: "Steering", type: "image" },
      { key: "suspension", label: "Suspension", type: "image" },
      { key: "brake", label: "Brake", type: "image" },
    ],
    []
  );

  // Hydrate state from Firestore + upload queue
  useEffect(() => {
    if (!inspection) return;

    const rebuilt = {};
    components.forEach((c) => {
      const sectionData = inspection.sections?.[SECTION_NAME]?.[c.key];
      const queued = uploadQueue.find(
        (q) =>
          q.inspectionId === inspectionId &&
          q.sectionKey === `${SECTION_NAME}.${c.key}`
      );

      if (queued) {
        rebuilt[c.key] = queued.remark ?? "Yes";
        return;
      }

      if (!sectionData) {
        rebuilt[c.key] = null;
        return;
      }

      const remark = sectionData?.remark ?? sectionData?.image?.remark ?? "";
      rebuilt[c.key] = remark ? "No" : "Yes";
    });

    setSelectedOptions(rebuilt);
  }, [inspection, uploadQueue, components, inspectionId]);

  const getUploadStatus = (componentKey) =>
    uploadQueue.find(
      (q) =>
        q.inspectionId === inspectionId &&
        q.sectionKey === `${SECTION_NAME}.${componentKey}`
    ) || null;

  const saveImagePermanently = async (uri, id) => {
    const safeSection = SECTION_NAME.replace(/\s+/g, "_");
    const newPath = `${FileSystem.documentDirectory}${inspectionId}_${safeSection}_${id}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: newPath });
    return newPath;
  };

  const handleYesWithCamera = async (componentKey) => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== "granted") {
        Alert.alert("Permission Denied", "Camera permission is required.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!result.canceled && result.assets?.length > 0) {
        const tempUri = result.assets[0].uri;
        const id = uuidv4();

        const localPath = await saveImagePermanently(tempUri, id);

        dispatch(
          addImageLocal({
            inspectionId,
            image: {
              id,
              localPath,
              sectionKey: `${SECTION_NAME}.${componentKey}`,
              remark: "",
            },
          })
        );
        dispatch(processUploadQueue());
      }
    } catch (err) {
      Alert.alert("Error", "Could not open camera: " + err.message);
    }
  };

  const handleOptionSelect = (componentKey, option, label) => {
    const status = getUploadStatus(componentKey);
    if (status?.status === "uploading") return;

    if (option === "No") {
      navigation.navigate("ComponentIssueScreen", {
        componentName: label,
        componentKey,
        tabName: SECTION_NAME,
        inspectionId,
        type: "image",
        onIssueSaved: (issueData) => {
          dispatch(
            saveSectionToFirestore({
              inspectionId,
              sectionKey: `${SECTION_NAME}.${componentKey}`,
              remark: issueData.reason,
            })
          );
        },
      });
    } else {
      handleYesWithCamera(componentKey);
    }
  };

  const YesNoButton = ({ label, componentKey }) => {
    const status = getUploadStatus(componentKey);
    const section = inspection?.sections?.[SECTION_NAME]?.[componentKey];

    let selected = selectedOptions[componentKey];
    if (section?.image?.uploaded || status?.status === "uploaded") {
      const remark = section?.image?.remark ?? "";
      selected = remark ? "No" : "Yes";
    }

    const hasImage = section?.image || status;

    return (
      <View style={styles.componentContainer}>
        <Text style={styles.componentLabel}>{label}</Text>
        <View style={styles.buttonContainer}>
          {["Yes", "No"].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.optionButton,
                selected === opt && styles.selectedButton,
              ]}
              onPress={() => handleOptionSelect(componentKey, opt, label)}
              disabled={status?.status === "uploading"}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  selected === opt && styles.selectedButtonText,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {hasImage && (
          <View style={styles.uploadedContainer}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="green"
              style={{ marginRight: 5 }}
            />
            <Text style={{ color: "green", fontWeight: "500" }}>File Added</Text>
          </View>
        )}

        {status?.status === "uploading" && (
          <Text style={{ color: "orange", marginTop: 5 }}>
            Uploading... {status.progress || 0}%
          </Text>
        )}

        {status?.status === "failed" && (
          <TouchableOpacity
            onPress={() => dispatch(processUploadQueue())}
            style={{ marginTop: 5 }}
          >
            <Text style={{ color: "red" }}>Upload Failed – Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const allCompleted = components.every((c) => {
    const section = inspection?.sections?.[SECTION_NAME]?.[c.key];
    const status = getUploadStatus(c.key);
    const firestoreUploaded = section?.image?.uploaded === true;
    const queueUploaded = status?.status === "uploaded";
    return firestoreUploaded || queueUploaded;
  });

  const handleNext = () => {
    if (!allCompleted) {
      Alert.alert(
        "Incomplete Inspection",
        "Please complete all checks before proceeding."
      );
      return;
    }
    route.params?.onComplete?.();
    navigation.goBack();
  };

  if (!inspectionId) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ padding: 20, color: "red" }}>
          ⚠️ No inspectionId provided.
        </Text>
      </SafeAreaView>
    );
  }

  if (!inspection) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ padding: 20 }}>Loading inspection...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Steering/Suspension + Brakes</Text>
          <Text style={styles.apptId}>Appt ID - {inspection.apptId}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.componentsContainer}>
          {components.map((c) => (
            <YesNoButton
              key={c.key}
              label={c.label}
              componentKey={c.key}
              type={c.type}
            />
          ))}
        </View>
      </ScrollView>

      {/* Next */}
      <View style={styles.nextButtonContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !allCompleted && { backgroundColor: "#9ca3af" },
          ]}
          onPress={handleNext}
          disabled={!allCompleted}
        >
          <Text style={styles.nextButtonText}>
            {allCompleted ? "NEXT" : "Complete all checks"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
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
    color: "#fff",
    marginBottom: 4,
  },
  apptId: { fontSize: 14, color: "#fff", opacity: 0.9 },
  headerRight: { width: 24 },
  content: { flex: 1 },
  componentsContainer: { paddingHorizontal: 20, paddingTop: 20 },
  componentContainer: { marginBottom: 24 },
  componentLabel: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
    marginBottom: 12,
  },
  buttonContainer: { flexDirection: "row", gap: 12 },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedButton: { backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" },
  optionButtonText: { fontSize: 16, color: "#6b7280", fontWeight: "500" },
  selectedButtonText: { color: "#fff", fontWeight: "600" },
  uploadedContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  nextButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  nextButton: {
    backgroundColor: "#1e3a8a",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default SteeringSuspensionBrakesInspection;
