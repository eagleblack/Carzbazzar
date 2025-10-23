import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../../styles/colors";
import {
  createInspection,
  deleteInspection,
} from "../../redux/inspectionSlice";
import { Ionicons } from "@expo/vector-icons";
import { logoutUser } from "../../redux/userSlice";
import auth from '@react-native-firebase/auth'; // ✅ RN Firebase

const InspectionScreenMain = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const inspectionsState = useSelector((state) => state.inspections);

  const [ownerName, setOwnerName] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [rcFrontUri, setRcFrontUri] = useState(null);
  const [rcBackUri, setRcBackUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addIngInspection,setAddingInspection]=useState(false)

  // Firestore listener for inspections
  useEffect(() => {
    if (!user?.uid) return;

    const subscriber = firestore()
      .collection("inspections")
      .where("userId", "==", user.uid)
      .onSnapshot(
        (querySnapshot) => {
          const inspections = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            inspections.push({
              firestoreId: doc.id,
              inspectionId: data.inspectionId,
              apptId: data.apptId,
              owner: {
                name: data.ownerName,
                address: data.ownerAddress,
                phone: data.phoneNumber,
              },
              rcFront: data.rcFront || null,
              rcBack: data.rcBack || null,
              status: data.status,
              sections: data.sections || {},
            });
          });

          dispatch({ type: "inspections/setAll", payload: inspections });
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching inspections:", error);
          setLoading(false);
        }
      );

    return () => subscriber();
  }, [user?.uid, dispatch]);

  // Capture Image (Front/Back)
  const handleCaptureImage = async (type) => {
    try {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== "granted" || mediaStatus !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Camera & storage permission is required."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets?.length > 0) {
        if (type === "front") setRcFrontUri(result.assets[0].uri);
        if (type === "back") setRcBackUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log("Camera error:", err);
      Alert.alert("Error", "Could not open camera: " + err.message);
    }
  };

  // Upload file helper
  const uploadFile = async (uri, path) => {
    const reference = storage().ref(path);
    await reference.putFile(uri);
    return await reference.getDownloadURL();
  };

  // Add inspection
  const handleAddInspection = async () => {
    if (!phoneNumber || !ownerName || !ownerAddress) {
      alert("Please fill all fields");
      return;
    }

    if (!rcFrontUri || !rcBackUri) {
      alert("Please capture both RC Front & Back photos");
      return;
    }

    setAddingInspection(true);

    let rcFrontUrl = null;
    let rcBackUrl = null;

    try {
      rcFrontUrl = await uploadFile(
        rcFrontUri,
        `rcPhotos/${user.uid}_front_${Date.now()}.jpg`
      );
      rcBackUrl = await uploadFile(
        rcBackUri,
        `rcPhotos/${user.uid}_back_${Date.now()}.jpg`
      );
    } catch (uploadErr) {
      console.error("Upload error:", uploadErr);
      alert("Failed to upload RC photos");
      setAddingInspection(false);
      return;
    }

    const result = await dispatch(
      createInspection({
        userId: user.uid,
        owner: {
          name: ownerName,
          address: ownerAddress,
          phone: phoneNumber,
        },
        rcFront: rcFrontUrl,
        rcBack: rcBackUrl,
      })
    );

    if (createInspection.fulfilled.match(result)) {
      setOwnerName("");
      setOwnerAddress("");
      setPhoneNumber("");
      setRcFrontUri(null);
      setRcBackUri(null);
      alert(
        `Inspection started!\nInspection ID: ${result.payload.inspectionId}\nAppt ID: ${result.payload.apptId}`
      );
    } else {
      alert("Failed to start inspection");
    }

    setAddingInspection(false);
  };

  const handleDeleteInspection = (firestoreId, inspectionId) => {
    dispatch(deleteInspection({ firestoreId, inspectionId }));
  };

  const inspections = inspectionsState.allIds.map(
    (id) => inspectionsState.byId[id]
  );
  const handleLogout = async () => {
    try {
      // 🔹 Firebase sign out
      await auth().signOut();

      // 🔹 Clear Redux user
      dispatch(logoutUser());

      Alert.alert('Logged out', 'You have been signed out successfully.');
    } catch (error) {
      console.error('Logout error: ', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vehicle Inspection</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Form */}
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Owner Name"
            value={ownerName}
            onChangeText={setOwnerName}
            placeholderTextColor={"black"}
          />
          <TextInput
            style={styles.input}
            placeholder="Owner Address"
            value={ownerAddress}
            onChangeText={setOwnerAddress}
            placeholderTextColor={"black"}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholderTextColor={"black"}
          />

          {/* RC Photos */}
          <TouchableOpacity
            style={[
              styles.startButton,
              { backgroundColor: rcFrontUri ? "green" : "#1e3a8a" },
            ]}
            onPress={() => handleCaptureImage("front")}
          >
            <Text style={styles.startButtonText}>
              {rcFrontUri ? "RC Front Captured ✅" : "Capture RC Front"}
            </Text>
          </TouchableOpacity>
          {rcFrontUri && (
            <Image source={{ uri: rcFrontUri }} style={styles.rcPreview} />
          )}

          <TouchableOpacity
            style={[
              styles.startButton,
              { backgroundColor: rcBackUri ? "green" : "#1e3a8a" },
            ]}
            onPress={() => handleCaptureImage("back")}
          >
            <Text style={styles.startButtonText}>
              {rcBackUri ? "RC Back Captured ✅" : "Capture RC Back"}
            </Text>
          </TouchableOpacity>
          {rcBackUri && (
            <Image source={{ uri: rcBackUri }} style={styles.rcPreview} />
          )}

          <TouchableOpacity style={styles.startButton} onPress={handleAddInspection} disabled={addIngInspection}>
            <Text style={styles.startButtonText}>Start Inspection</Text>
          </TouchableOpacity>
        </View>

        {/* Existing inspections */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Your Inspections</Text>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : inspections.length === 0 ? (
            <Text style={styles.noData}>No inspections found</Text>
          ) : (
            inspections.map((insp) => (
              <TouchableOpacity
                key={insp.inspectionId}
                style={styles.inspectionCard}
                //disabled={insp.status !== "inspecting" || insp.status == "approved"}
                onPress={() =>
                  navigation.navigate("Inspection", {
                    inspection: insp,
                  })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.ownerName}>{insp.owner?.name}</Text>
                  <Text style={styles.details}>{insp.owner?.address}</Text>
                  <Text style={styles.details}>{insp.owner?.phone}</Text>
                  <Text style={styles.details}>
                    Inspection ID: {insp.inspectionId}
                  </Text>
                  <Text style={styles.details}>Appt ID: {insp.apptId}</Text>
                </View>

                <View
                  style={{ alignItems: "flex-end", justifyContent: "space-between" }}
                >
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{insp.status}</Text>
                  </View>
                  {insp.status === "inspecting" ? (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() =>
                        handleDeleteInspection(insp.firestoreId, insp.inspectionId)
                      }
                    >
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
               <TouchableOpacity
            style={[styles.menuItem, styles.logoutMenuItem]}
            onPress={handleLogout}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, styles.logoutText]}>Logout</Text>
              <Text style={styles.menuSubtitle}>Sign out of your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.error} />
          </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  scrollView: { flex: 1 },
  formContainer: { padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  startButton: {
    backgroundColor: "#1e3a8a",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  startButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  listContainer: { padding: 20 },
  listTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  inspectionCard: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ownerName: { fontSize: 16, fontWeight: "bold" },
  details: { fontSize: 14, color: "#6b7280" },
  statusBadge: {
    backgroundColor: "#e0e7ff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  statusText: { fontSize: 12, fontWeight: "600", color: "#1e3a8a" },
  deleteBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  noData: { fontSize: 14, color: "#9ca3af" },
  rcPreview: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: "cover",
  },
    menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: { marginRight: 16 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '500', color: COLORS.text, marginBottom: 4 },
  menuSubtitle: { fontSize: 14, color: COLORS.gray },
  logoutMenuItem: { borderBottomWidth: 0 },
  logoutText: { color: COLORS.error },
});

export default InspectionScreenMain;
