import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { markSectionCompleted } from "../../redux/inspectionProgressSlice"; // <-- updated path
import { COLORS } from "../../styles/colors";
import { completeInspection } from "../../redux/inspectionSlice";

const InspectionScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const inspection = route.params.inspection;

  // ✅ Get progress from Redux for this inspectionId
  const completedSections =
    useSelector(
      (state) =>
        state.inspectionProgress.inspections[inspection.inspectionId]
          ?.completedSections
    ) || {
      carDetails: false,
      exteriorTyres: false,
      electricalInterior: false,
      engineTransmission: false,
      steeringSuspension: false,
      airConditioning: false,
      summary: true,
      imageReview: true,
    };

  const inspectionCategories = [
    { id: 1, name: "CAR DETAILS", sectionKey: "carDetails", completed: completedSections.carDetails },
    { id: 2, name: "EXTERIOR + TYRES", sectionKey: "exteriorTyres", completed: completedSections.exteriorTyres },
    { id: 3, name: "ELECTRICAL + INTERIOR", sectionKey: "electricalInterior", completed: completedSections.electricalInterior },
    { id: 4, name: "ENGINE + TRANSMISSION", sectionKey: "engineTransmission", completed: completedSections.engineTransmission },
    { id: 5, name: "STEERING/SUSPENSION + BRAKES", sectionKey: "steeringSuspension", completed: completedSections.steeringSuspension },
    { id: 6, name: "AIR CONDITIONING", sectionKey: "airConditioning", completed: completedSections.airConditioning },
    { id: 7, name: "SUMMARY", sectionKey: "summary", completed: true },
  ];

  const handleCategoryPress = (category) => {
    console.log("Category pressed:", category.name);

    switch (category.name) {
      case "CAR DETAILS":
        navigation.navigate("CarDetailsInspection", {
          inspection,
          onComplete: () =>
            dispatch(
              markSectionCompleted({
                inspectionId: inspection.inspectionId,
                sectionKey: category.sectionKey,
              })
            ),
        });
        break;
      case "EXTERIOR + TYRES":
        navigation.navigate("ExteriorTyresInspection", {
          inspection,
          onComplete: () =>
            dispatch(
              markSectionCompleted({
                inspectionId: inspection.inspectionId,
                sectionKey: category.sectionKey,
              })
            ),
        });
        break;
      case "ELECTRICAL + INTERIOR":
        navigation.navigate("ElectricalInteriorInspection", {
          inspection,
          onComplete: () =>
            dispatch(
              markSectionCompleted({
                inspectionId: inspection.inspectionId,
                sectionKey: category.sectionKey,
              })
            ),
        });
        break;
      case "ENGINE + TRANSMISSION":
        navigation.navigate("EngineTransmissionInspection", {
          inspection,
          onComplete: () =>
            dispatch(
              markSectionCompleted({
                inspectionId: inspection.inspectionId,
                sectionKey: category.sectionKey,
              })
            ),
        });
        break;
      case "STEERING/SUSPENSION + BRAKES":
        navigation.navigate("SteeringSuspensionBrakesInspection", {
          inspection,
          onComplete: () =>
            dispatch(
              markSectionCompleted({
                inspectionId: inspection.inspectionId,
                sectionKey: category.sectionKey,
              })
            ),
        });
        break;
      case "AIR CONDITIONING":
        navigation.navigate("AirConditioningInspection", {
          inspection,
          onComplete: () =>
            dispatch(
              markSectionCompleted({
                inspectionId: inspection.inspectionId,
                sectionKey: category.sectionKey,
              })
            ),
        });
        break;
      case "SUMMARY":
        navigation.navigate("Review", {
          inspectionId: inspection.inspectionId,
          onComplete: () =>
            dispatch(
              markSectionCompleted({
                inspectionId: inspection.inspectionId,
                sectionKey: category.sectionKey,
              })
            ),
        });
        break;
      case "IMAGE REVIEW":
        console.log("Navigate to Image Review Inspection");
        break;
      default:
        console.log("Unknown category:", category.name);
    }
  };

  // ✅ Check if all required sections are complete (summary ignored)
  const allCompleted = Object.entries(completedSections).every(
    ([key, value]) => key === "summary" || value === true
  );

  const handleSubmit = () => {
    if (!allCompleted) return; // prevent accidental press
    console.log("Submit inspection");
    navigation.navigate("InspectionMain")
   dispatch(completeInspection(inspection.inspectionId));

    // dispatch(resetInspectionProgress({ inspectionId: inspection.inspectionId }))
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.inspectionId}>
          Inspection Id: {inspection?.inspectionId}
        </Text>
        <Text style={styles.apptId}>Appt ID - {inspection?.apptId}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Inspection Categories */}
        <View style={styles.categoriesContainer}>
          {inspectionCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(category)}
            >
              <View style={styles.categoryContent}>
                {category.completed && (
                  <View style={styles.completedIcon}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  </View>
                )}
                <Text
                  style={[
                    styles.categoryText,
                    category.completed && styles.completedText,
                  ]}
                >
                  {category.name}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
               {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
             !allCompleted && { backgroundColor: "#9ca3af" }, // gray if disabled
            ]}
            onPress={handleSubmit}
            disabled={!allCompleted}
          >
            <Text style={styles.submitButtonText}>SUBMIT</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: "center",
  },
  inspectionId: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  apptId: { fontSize: 14, color: "#ffffff", opacity: 0.9 },
  scrollView: { flex: 1 },
  categoriesContainer: { paddingHorizontal: 20, paddingTop: 20 },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  categoryContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  completedIcon: { marginRight: 12 },
  categoryText: { fontSize: 16, color: "#6b7280", fontWeight: "500" },
  completedText: { color: "#10b981", fontWeight: "600" },
  submitContainer: { paddingHorizontal: 20, paddingVertical: 30 },
  submitButton: {
    backgroundColor: "#1e3a8a",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
});

export default InspectionScreen;
