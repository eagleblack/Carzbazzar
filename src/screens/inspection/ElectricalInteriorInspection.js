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
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useDispatch, useSelector } from "react-redux";
import { COLORS } from "../../styles/colors";
import {
  addImageLocal,
  processUploadQueue,
  saveSectionToFirestore,
} from "../../redux/inspectionSlice";
import { uuidv4 } from "../../utils/uuid";

const SECTION_NAME = "electricalInterior";

const ElectricalInteriorInspection = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const inspectionParam = route.params?.inspection;
  const inspectionId = inspectionParam?.inspectionId;
  const inspection = useSelector((s) => s.inspections.byId[inspectionId]);
  const uploadQueue = useSelector((s) => s.inspections.uploadQueue);

  const tabs = useMemo(
    () => [
      "Power Windows",
      "Safety Features",
      "Audio & Entertainment",
      "Interior Features",
      "Visibility & Safety",
    ],
    []
  );

  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [selectedOptions, setSelectedOptions] = useState({});

  const components = useMemo(
    () => ({
      "Power Windows": [
        { key: "powerWindowsLhsFront", label: "LHS Front Power Window", type: "choice" },
        { key: "powerWindowsLhsRear", label: "LHS Rear Power Window", type: "choice" },
        { key: "powerWindowsRhsFront", label: "RHS Front Power Window", type: "choice" },
        { key: "powerWindowsRhsRear", label: "RHS Rear Power Window", type: "choice" },
      ],
      "Safety Features": [
        { key: "airbagFeature", label: "Airbag Feature", type: "choice" },
        { key: "abs", label: "ABS", type: "choice" },
      ],
      "Audio & Entertainment": [
        { key: "musicSystem", label: "Music System", type: "image" },
        { key: "steeringMountedAudioControl", label: "Steering Mounted Audio Control", type: "image" },
      ],
      "Interior Features": [
        { key: "leatherSeat", label: "Leather Seat", type: "choice" },
        { key: "fabricSeat", label: "Fabric Seat", type: "choice" },
        { key: "sunroof", label: "Sunroof", type: "image" },
      ],
      "Visibility & Safety": [
        { key: "rearDefogger", label: "Rear Defogger", type: "choice" },
        { key: "reverseCamera", label: "Reverse Camera", type: "choice" },
      ],
    }),
    []
  );

  // ───────── Hydrate selected state from Firestore + queue ─────────
  useEffect(() => {
    if (!inspection) return;

    const rebuilt = {};
    tabs.forEach((tab) => {
      rebuilt[tab] = {};
      components[tab].forEach((c) => {
        const sectionData = inspection.sections?.[SECTION_NAME]?.[tab]?.[c.key];
        const queued = uploadQueue.find(
          (q) =>
            q.inspectionId === inspectionId &&
            q.sectionKey === `${SECTION_NAME}.${tab}.${c.key}`
        );

        if (queued) {
          rebuilt[tab][c.key] = queued.remark ?? (c.type === "choice" ? null : "Yes");
          return;
        }

        if (!sectionData) {
          rebuilt[tab][c.key] = null;
          return;
        }

        const remark = sectionData?.remark ?? sectionData?.image?.remark ?? "";
        rebuilt[tab][c.key] = c.type === "choice" ? remark || null : remark ? "No" : "Yes";
      });
    });

    setSelectedOptions(rebuilt);
  }, [inspection, uploadQueue, tabs, components, inspectionId]);

  const getUploadStatus = (tab, key) =>
    uploadQueue.find(
      (q) =>
        q.inspectionId === inspectionId &&
        q.sectionKey === `${SECTION_NAME}.${tab}.${key}`
    ) || null;

  const saveImagePermanently = async (uri, tab, id, key) => {
    const newPath = `${FileSystem.documentDirectory}${inspectionId}_${SECTION_NAME}_${tab}_${key}_${id}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: newPath });
    return newPath;
  };

  const handleYesWithCamera = async (tab, key) => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (
        cameraPermission.status !== "granted" ||
        mediaPermission.status !== "granted"
      ) {
        Alert.alert("Permission Denied", "Camera & storage permission is required.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!result.canceled && result.assets?.length > 0) {
        const tempUri = result.assets[0].uri;
        const id = uuidv4();
        const localPath = await saveImagePermanently(tempUri, tab, id, key);

        dispatch(
          addImageLocal({
            inspectionId,
            image: {
              id,
              localPath,
              sectionKey: `${SECTION_NAME}.${tab}.${key}`,
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

  const handleOptionSelect = (tab, key, label, type, option) => {
    const status = getUploadStatus(tab, key);
    if (status?.status === "uploading") return;

    if (type === "choice") {
      if (option === "No") {
        navigation.navigate("ComponentIssueScreen", {
          componentName: label,
          componentKey: key,
          tabName: `${SECTION_NAME}.${tab}`,
          inspectionId,
          type,
          onIssueSaved: (issueData) => {
            dispatch(
              saveSectionToFirestore({
                inspectionId,
                sectionKey: `${SECTION_NAME}.${tab}.${key}`,
                remark: issueData.reason,
              })
            );
          },
        });
      } else {
        dispatch(
          saveSectionToFirestore({
            inspectionId,
            sectionKey: `${SECTION_NAME}.${tab}.${key}`,
            remark: option,
          })
        );
      }
    } else {
      if (option === "No") {
        navigation.navigate("ComponentIssueScreen", {
          componentName: label,
          componentKey: key,
          tabName: `${SECTION_NAME}.${tab}`,
          inspectionId,
          type,
          onIssueSaved: (issueData) => {
            dispatch(
              saveSectionToFirestore({
                inspectionId,
                sectionKey: `${SECTION_NAME}.${tab}.${key}`,
                remark: issueData.reason,
              })
            );
          },
        });
      } else {
        handleYesWithCamera(tab, key);
      }
    }
  };

  const YesNoButton = ({ tab, c }) => {
    const status = getUploadStatus(tab, c.key);
    const section = inspection?.sections?.[SECTION_NAME]?.[tab]?.[c.key];
    const selected = selectedOptions[tab]?.[c.key];

    const isChoice = c.type === "choice";
    const hasImage = !isChoice && (section?.image || status);

    return (
      <View style={styles.componentContainer}>
        <Text style={styles.componentLabel}>{c.label}</Text>
        <View style={styles.buttonContainer}>
          {["Yes", "No", ...(isChoice ? ["N/A"] : [])].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.optionButton,
                selected === opt && styles.selectedButton,
              ]}
              onPress={() => handleOptionSelect(tab, c.key, c.label, c.type, opt)}
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

  const allCompleted = tabs.every((tab) =>
    components[tab].every((c) => {
      if (c.type === "choice") return !!selectedOptions[tab]?.[c.key];
      const section = inspection?.sections?.[SECTION_NAME]?.[tab]?.[c.key];
      const status = getUploadStatus(tab, c.key);
      const firestoreUploaded = section?.image?.uploaded === true;
      const queueUploaded = status?.status === "uploaded";
      return firestoreUploaded || queueUploaded;
    })
  );

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
        <Text style={{ padding: 20, color: "red" }}>⚠️ No inspectionId provided.</Text>
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

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Electrical + Interior</Text>
          <Text style={styles.apptId}>Appt ID - {inspection.apptId}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.componentsContainer}>
          {components[activeTab].map((c) => (
            <YesNoButton key={c.key} tab={activeTab} c={c} />
          ))}
        </View>
      </ScrollView>

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
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  apptId: { fontSize: 14, color: "#fff", opacity: 0.9 },
  headerRight: { width: 24 },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center", position: "relative" },
  tabText: { fontSize: 14, color: "#9ca3af", fontWeight: "500" },
  activeTabText: { color: "#1e3a8a", fontWeight: "600" },
  tabIndicator: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "#1e3a8a" },
  content: { flex: 1 },
  componentsContainer: { paddingHorizontal: 20, paddingTop: 20 },
  componentContainer: { marginBottom: 24 },
  componentLabel: { fontSize: 16, color: "#374151", fontWeight: "500", marginBottom: 12 },
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
  uploadedContainer: { flexDirection: "row", alignItems: "center", marginTop: 6 },
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

export default ElectricalInteriorInspection;
