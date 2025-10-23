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
import { uuidv4 } from "../../utils/uuid";
import {
  addImageLocal,
  processUploadQueue,
} from "../../redux/inspectionSlice";

const SECTION_NAME = "ExteriorTyres";

const ExteriorTyresInspection = ({ navigation, route }) => {
  const dispatch = useDispatch();

  const inspectionParam = route.params?.inspection;
  const inspectionId = inspectionParam?.inspectionId;
  const inspection = useSelector((s) => s.inspections.byId[inspectionId]);
  const uploadQueue = useSelector((s) => s.inspections.uploadQueue);

  const tabs = ["Front", "Left", "Rear", "Right"];
  const [activeTab, setActiveTab] = useState("Front");
  const [selectedOptions, setSelectedOptions] = useState({});

  // Define components (all type=image)
  const components = useMemo(
    () => ({
      Front: [
        { key: "frontWindshield", label: "Front Windshield", type: "image" },
        { key: "frontBumper", label: "Front Bumper", type: "image" },
        { key: "bonnetHood", label: "Bonnet/Hood", type: "image" },
        { key: "lhsHeadlight", label: "Head Light", type: "image" },
        { key: "lhsFogLight", label: "Fog Light", type: "image" },
        { key: "lhsApronLeg", label: "LHS Apron Leg", type: "image" },
        { key: "rhsApronLeg", label: "RHS Apron Leg", type: "image" },
        { key: "grill", label: "Grill", type: "image" },
        { key: "firewall", label: "Firewall", type: "image" },
        { key: "cowlTop", label: "Cowl Top", type: "image" },  
        { key: "lowerCrossMember", label: "Lower Cross Member", type: "image" },
        { key: "upperCrossMember", label: "Upper Cross Member", type: "image" },
        { key: "headLightSupport", label: "Head Light Support", type: "image" },
        { key: "radiatorSupport", label: "Radiator Support", type: "image" },
        { key: "alloyWheel", label: "Alloy Wheel", type: "image" },
           { key: "leftFrontTyre", label: "Left Front Tyre",  type: "image" },
  { key: "rightFrontTyre", label: "Right Front Tyre", type: "image"},
      ],
      Left: [
        { key: "lhsFender", label: "LHS Fender", type: "image" },
        { key: "lhsTyre", label: "LHS Tyre", type: "image" },
        { key: "lhsOrvm", label: "LHS ORVM", type: "image" },
        { key: "lhsFrontDoor", label: "LHS Front Door", type: "image" },
        { key: "lhsRearDoor", label: "LHS Rear Door", type: "image" },
        { key: "lhsPillarA", label: "LHS Pillar A", type: "image" },
        { key: "lhsPillarB", label: "LHS Pillar B", type: "image" },
        { key: "lhsPillarC", label: "LHS Pillar C", type: "image" },
        { key: "lhsRunningBorder", label: "LHS Running Border", type: "image" },
        { key: "lhsQuarterPanel", label: "LHS Quarter Panel", type: "image" },
         { key: "lhsAppron", label: "LHS Appron", type: "image" },
      ],
      Rear: [
        { key: "rearWindshield", label: "Rear Windshield", type: "image" },
        { key: "rearBumper", label: "Rear Bumper", type: "image" },
        { key: "dickyDoor", label: "Dicky Door", type: "image" },
        { key: "bootFloor", label: "Boot Floor", type: "image" },
        { key: "lhsTaillight", label: "LHS Taillight", type: "image" },
        { key: "rhsTaillight", label: "RHS Taillight", type: "image" },
        { key: "spareTyre", label: "Spare Tyre", type: "image" },
        { key: "leftRearTyre", label: "Left Rear Tyre", type: "image" },
        { key: "RightRearTyre", label: "Right Rear Tyre", type: "image" },

      ],
      Right: [
        { key: "rhsFender", label: "RHS Fender", type: "image" },
        { key: "rhsTyre", label: "RHS Tyre", type: "image" },
        { key: "rhsOrvm", label: "RHS ORVM", type: "image" },
        { key: "rhsFrontDoor", label: "RHS Front Door", type: "image" },
        { key: "rhsRearDoor", label: "RHS Rear Door", type: "image" },
        { key: "rhsPillarA", label: "RHS Pillar A", type: "image" },
        { key: "rhsPillarB", label: "RHS Pillar B", type: "image" },
        { key: "rhsPillarC", label: "RHS Pillar C", type: "image" },
        { key: "rhsRunningBorder", label: "RHS Running Border", type: "image" },
        { key: "rhsQuarterPanel", label: "RHS Quarter Panel", type: "image" },
        { key: "rhsAppron", label: "RHS Appron", type: "image" },
        { key: "rhsHeadLight", label: "RHS Head Light", type: "image" },


      ],
    }),
    []
  );

  // Hydrate selectedOptions
  useEffect(() => {
    if (!inspection) return;

    const rebuilt = {};
    tabs.forEach((tab) => {
      rebuilt[tab] = {};
      components[tab].forEach((c) => {
        const sectionData = inspection.sections?.[tab]?.[c.key];
        const queued = uploadQueue.find(
          (q) =>
            q.inspectionId === inspectionId &&
            q.sectionKey === `${tab}.${c.key}`
        );

        if (queued) {
          rebuilt[tab][c.key] = "Yes";
          return;
        }

        if (!sectionData) {
          rebuilt[tab][c.key] = null;
          return;
        }

        const remark = sectionData?.image?.remark ?? "";
        rebuilt[tab][c.key] = remark ? "No" : "Yes";
      });
    });

    setSelectedOptions(rebuilt);
  }, [inspection, uploadQueue, inspectionId, components]);

  const getUploadStatus = (componentKey) =>
    uploadQueue.find(
      (q) =>
        q.inspectionId === inspectionId &&
        q.sectionKey === `${activeTab}.${componentKey}`
    ) || null;

  const saveImagePermanently = async (uri, id, sectionKey) => {
    const newPath = `${FileSystem.documentDirectory}${inspectionId}_${sectionKey}_${id}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: newPath });
    return newPath;
  };

  const handleYesWithCamera = async (componentKey) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Camera permission is required.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!result.canceled && result.assets?.length > 0) {
        const tempUri = result.assets[0].uri;
        const id = uuidv4();
        const sectionKey = `${activeTab}.${componentKey}`;

        const localPath = await saveImagePermanently(tempUri, id, sectionKey);

        dispatch(
          addImageLocal({
            inspectionId,
            image: {
              id,
              localPath,
              sectionKey,
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
        tabName: activeTab,
        inspectionId,
        type: "image",
      });
    } else {
      handleYesWithCamera(componentKey);
    }
  };

  const YesNoButton = ({ label, componentKey }) => {
    const status = getUploadStatus(componentKey);
    const section = inspection?.sections?.[activeTab]?.[componentKey];
    const remark = section?.image?.remark ?? "";

    let selected = selectedOptions[activeTab]?.[componentKey];
    if (section?.image?.uploaded || status) {
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
            <Text style={{ color: "green", fontWeight: "500" }}>
              File Added
            </Text>
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
      const section = inspection?.sections?.[tab]?.[c.key];
      const status = uploadQueue.find(
        (q) =>
          q.inspectionId === inspectionId &&
          q.sectionKey === `${tab}.${c.key}`
      );
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
          <Text style={styles.headerTitle}>Exterior + Tyres</Text>
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
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Components */}
      <ScrollView style={styles.content}>
        <View style={styles.componentsContainer}>
          {components[activeTab].map((c) => (
            <YesNoButton
              key={c.key}
              label={c.label}
              componentKey={c.key}
              type={c.type}
            />
          ))}
        </View>
      </ScrollView>

      {/* Next button */}
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
  container: { flex: 1, backgroundColor: "#ffffff" },
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
  apptId: { fontSize: 14, color: "#ffffff", opacity: 0.9 },
  headerRight: { width: 24 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    position: "relative",
  },
  tabText: { fontSize: 16, color: "#9ca3af", fontWeight: "500" },
  activeTabText: { color: "#1e3a8a", fontWeight: "600" },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#1e3a8a",
  },
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
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedButton: { backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" },
  optionButtonText: { fontSize: 16, color: "#6b7280", fontWeight: "500" },
  selectedButtonText: { color: "#ffffff", fontWeight: "600" },
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
  nextButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
});

export default ExteriorTyresInspection;
