import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,

} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import firestore from "@react-native-firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import { TabView, TabBar } from "react-native-tab-view";
import { COLORS } from "../styles/colors";
import { componentLabelMap } from "../utils/componentLabels";
import { Alert } from 'react-native';
import Slider from "@react-native-community/slider";
import * as Clipboard from "expo-clipboard";



import auth from "@react-native-firebase/auth"; // to get current user

const { width } = Dimensions.get("window");
const HUMAN_READABLE_LABELS = {
  name: "Car Name",
  model: "Model",
  yearOfManufacturing: "Year of Manufacturing",
  registrationYear: "Registration Year",
  registrationMonth: "Registration Month",
  regCity: "Registration City",
  regState: "Registration State",
  registrationNumber: "Registration Number",
  fuelType: "Fuel Type",
  km: "Kilometers Driven",
  numberOfOwners: "Number of Owners",
  inspectionAtDoorstep: "Inspection at Doorstep",
  rcAvailability: "RC Availability",
  rcCondition: "RC Condition",
  rtoNocIssued: "RTO NOC Issued",
  insuranceType: "Insurance Type",
  insuranceExpiry: "Insurance Expiry",
  roadTaxPaid: "Road Tax Paid",
  roadTaxDate: "Road Tax Date",
  chassisNumber: "Chassis Number",
  duplicateKey: "Duplicate Key",
  embossing: "Embossing",
  toBeScrapped: "To Be Scrapped",
  cngLpgFitment: "CNG/LPG Fitment",
  branch: "Branch",
  city: "City",
  rto: "RTO Code",
  mismatchInRc: "Mismatch in RC",
  manufacturingMonth: "Manufacturing Month",
};

const importantDocsKeys = [
  "rcAvailability",
  "rcCondition",
  "rtoNocIssued",
  "insuranceType",
  "insuranceExpiry",
  "roadTaxPaid",
  "roadTaxDate",
];

/* ---------- Helpers ---------- */
function getReadableLabel(key) {
  return componentLabelMap[key] || formatLabel(key);
}
 const flattenValue = (value) => {
    if (value === undefined || value === null || value === "") return "—";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value.toString();
    if (typeof value === "object") {
      if (value.url) return value.url;
      if (value.remark) return value.remark;
      return JSON.stringify(value);
    }
    return "—";
  };
function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function getStatus(remark) {
  if (remark && remark.trim().length > 0) {
    return { icon: "close-circle", color: "red" };
  }
  return { icon: "checkmark-circle", color: "green" };
}

// Recursive function to flatten nested section objects
const buildDamages = (secObj, parentKey = "") => {
  if (!secObj) return { rows: [] };

  const rows = [];

  Object.entries(secObj).forEach(([key, item]) => {
    const fullKey = parentKey
      ? `${parentKey} > ${getReadableLabel(key)}`
      : getReadableLabel(key);

    if (
      typeof item === "object" &&
      (item?.remark || item?.image || item?.url || item?.type)
    ) {
      const remark =
        typeof item?.remark === "string"
          ? item.remark.trim()
          : typeof item?.image?.remark === "string"
          ? item.image.remark.trim()
          : "";

      const imageUrl =
        typeof item?.url === "string" && item.url.trim() !== ""
          ? item.url
          : typeof item?.image?.url === "string" &&
            item.image.url.trim() !== ""
          ? item.image.url
          : null;

      const type =
        item?.type ||
        item?.image?.type ||
        "image"; // fallback if type missing

      rows.push({
        part: fullKey,
        remark,
        imageUrl,
        type,
      });
    } else if (typeof item === "object") {
      rows.push(...buildDamages(item, fullKey).rows);
    }
  });

  return { rows };
};


/* ---------- Main Component ---------- */
const CarDetailsScreen = ({ navigation, route }) => {
  const { inspectionId } = route.params;
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "engine", title: "Engine & Transmission" },
    { key: "electrical", title: "Electrical + Interior" },
    { key: "suspension", title: "Suspension & Brakes" },
    { key: "ac", title: "Air Conditioning" },
    { key: "exterior", title: "Exterior & Tyres" },
  ]);
 const currentUser = auth().currentUser; // Firebase Auth user (assuming you’re using Firebase Auth)
const [alreadyPurchased, setAlreadyPurchased] = useState(false);
const [submitting, setSubmitting] = useState(false);
const [bestPriceModalVisible, setBestPriceModalVisible] = useState(false);
const [quotedPrice, setQuotedPrice] = useState(
  inspection?.minPrice || 0
);

useEffect(() => {
  if (inspection) {
    setQuotedPrice(parseInt(inspection.minPrice) ?? 0);
  }
}, [inspection]);
const handleBestPriceBuy = () => {
  Alert.alert(
    "Confirm Purchase",
    `Buy at your quoted price ₹${quotedPrice.toLocaleString("en-IN")}?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          setSubmitting(true);
          try {
            await firestore().runTransaction(async (transaction) => {
              // 🔹 Get inspection doc
              const querySnapshot = await firestore()
                .collection("inspections")
                .where("inspectionId", "==", inspectionId)
                .limit(1)
                .get();

              if (querySnapshot.empty) throw new Error("Inspection not found");
              const inspectionDoc = querySnapshot.docs[0];
              const inspectionRef = inspectionDoc.ref;
              const inspectionData = inspectionDoc.data();

              // 🔹 Get user doc
              const userRef = firestore().collection("users").doc(currentUser.uid);
              const userDoc = await transaction.get(userRef);
              if (!userDoc.exists) throw new Error("User not found");
              const userData = userDoc.data();

              const buyer = {
                uid: currentUser?.uid ?? "",
                fullName: `${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim(),
                email: userData?.email ?? currentUser?.email ?? "",
                phone: userData?.phoneNumber ?? "",
                purchasedAt: Date.now(),
                quotedPrice,
              };

              // ✅ Update inspection.negotiaters
              let negotiaters = inspectionData.negotiaters || [];
              const existingIndex = negotiaters.findIndex((n) => n.uid === buyer.uid);

              if (existingIndex >= 0) {
                // Update quotedPrice & purchasedAt
                negotiaters[existingIndex].quotedPrice = quotedPrice;
                negotiaters[existingIndex].purchasedAt = Date.now();
              } else {
                // Add new buyer
                negotiaters.push(buyer);
              }

              transaction.update(inspectionRef, { negotiaters });

              // ✅ Update user.negotiated (array of objects)
              let negotiated = userData.negotiated || [];
              const userIndex = negotiated.findIndex((n) => n.inspectionId === inspectionId);

              if (userIndex >= 0) {
                negotiated[userIndex].quotedPrice = quotedPrice;
                negotiated[userIndex].purchasedAt = Date.now();
              } else {
                negotiated.push({
                  inspectionId,
                  quotedPrice,
                  purchasedAt: Date.now(),
                });
              }

              transaction.update(userRef, { negotiated });
            });

            setBestPriceModalVisible(false);

            Alert.alert("Success", "Your negotiation has been submitted!", [
              {
                text: "OK",
                onPress: () => {
                  navigation.navigate("MainApp", { screen: "Orders" });
                },
              },
            ]);
          } catch (err) {
            console.error("Best Price Buy failed:", err);
            Alert.alert("Error", err.message || "Purchase failed. Please try again.");
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]
  );
};


useEffect(() => {
  if (!currentUser) return;

  const userRef = firestore().collection("users").doc(currentUser.uid);

  const unsubscribe = userRef.onSnapshot((doc) => {
    if (doc.exists) {
      const purchased = doc.data().purchased || [];
      setAlreadyPurchased(purchased.includes(inspectionId));
    }
  });

  return () => unsubscribe();
}, [inspectionId, currentUser]);
const handleOneClickBuy = () => {
  Alert.alert(
    "Confirm Purchase",
    "Are you sure you want to buy this?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          setSubmitting(true); // disable button right away
          try {
            await firestore().runTransaction(async (transaction) => {
              // find inspection doc by inspectionId field
              const querySnapshot = await firestore()
                .collection("inspections")
                .where("inspectionId", "==", inspectionId)
                .limit(1)
                .get();

              if (querySnapshot.empty) {
                throw new Error("Inspection not found");
              }

              const inspectionDoc = querySnapshot.docs[0];
              const inspectionRef = inspectionDoc.ref;

              // fetch user
              const userRef = firestore().collection("users").doc(currentUser.uid);
              const userDoc = await transaction.get(userRef);

              if (!userDoc.exists) {
                throw new Error("User not found");
              }

              const userData = userDoc.data();

              const buyer = {
                uid: currentUser?.uid ?? "",
                fullName: `${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim(),
                email: userData?.email ?? currentUser?.email ?? "",
                phone: userData?.phoneNumber ?? "",
                purchasedAt: Date.now(), // 🔹 store as plain JS timestamp (ms)
                quotedPrice:inspection?.closingPrice
              };

              // prevent duplicates
              if ((userData.purchased || []).includes(inspectionId)) {
                throw new Error("Already purchased this car");
              }
transaction.update(inspectionRef, {
  buyers: firestore.FieldValue.arrayUnion(buyer),
  status: "purchased",   // ✅ add this
});
              transaction.update(userRef, {
                purchased: firestore.FieldValue.arrayUnion(inspectionId),
              });
            });

              Alert.alert("Success", "You have successfully purchased this car!", [
              {
                text: "OK",
                onPress: () => {
                 navigation.navigate("MainApp", {
  screen: "Orders",
}); // 👈 jump straight to Orders tab
                },
              },
            ]);
          } catch (err) {
            console.error("One Click Buy failed:", err);
            Alert.alert("Error", err.message || "Purchase failed. Please try again.");
          } finally {
            setSubmitting(false); // re-enable button
          }
        },
      },
    ]
  );
};

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        const snapshot = await firestore()
          .collection("inspections")
          .where("inspectionId", "==", inspectionId)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          setInspection(snapshot.docs[0].data());
        }
      } catch (err) {
        console.error("Error fetching inspection:", err);
      } finally {
        setLoading(false);
      }
    };

    if (inspectionId) fetchInspection();
  }, [inspectionId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!inspection) {
    return (
      <View style={styles.centered}>
        <Text>No Data Found</Text>
      </View>
    );
  }

  const car = inspection.sections?.carDetails || {};

  // Build image array
  const images = [];
  if (car.image?.url) images.push({ url: car.image.url });
  ["Front", "Rear", "Left"].forEach((section) => {
    const secObj = inspection.sections?.[section];
    if (secObj) {
      Object.values(secObj).forEach((item) => {
        if (item?.image?.url) {
          images.push({ url: item.image.url });
        }
      });
    }
  });
  if (images.length === 0)
    images.push({
      url: "https://via.placeholder.com/400x220?text=No+Image",
    });

  /* --- Damages Data --- */
  const sections = inspection.sections || {};
  const groupData = {
    engine: buildDamages(sections.EngineTransmission),
    electrical: buildDamages(sections.electricalInterior),
    suspension: buildDamages(sections.SteeringSuspensionBrakes),
    ac: buildDamages(sections["Air Conditioning"]),
    exterior: {
      rows: [
        ...buildDamages(sections.Front).rows,
        ...buildDamages(sections.Rear).rows,
        ...buildDamages(sections.Left).rows,
        ...buildDamages(sections.Right).rows,
      ],
    },
  };
const renderScene = ({ route }) => {
  const { rows } = groupData[route.key] || { rows: [] };

  return (
    <ScrollView style={styles.scene}>
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.cell, styles.partCol]}>Part</Text>
        <Text style={[styles.cell, styles.statusCol]}>Status</Text>
        <Text style={[styles.cell, styles.remarkCol]}>
           Condition
        </Text>
      </View>

      {rows.length > 0 ? (
        rows.map((row, i) => {
          // Determine icon & color
          let icon = "checkmark-circle";
          let color = "green";

          if (row.type === "choice") {
            const remarkLower = row.remark?.toLowerCase() || "";
            if (remarkLower !== "yes" && remarkLower !== "n/a") {
              icon = "close-circle";
              color = "red";
            }
          } else {
            const status = getStatus(row.remark);
            icon = status.icon;
            color = status.color;
          }

          return (
            <View
              key={i}
              style={[
                styles.row,
                { backgroundColor: i % 2 === 0 ? "#fff" : "#f9f9f9" },
              ]}
            >
              <Text style={[styles.cell, styles.partCol]}>{row.part}</Text>
              <View
                style={[
                  styles.cell,
                  styles.statusCol,
                  { alignItems: "center" },
                ]}
              >
                <Ionicons name={icon} size={20} color={color} />
              </View>
              <View style={[styles.cell, styles.remarkCol]}>
                <Text>{row.remark !== "" ? row.remark : "-"}</Text>
                {row.imageUrl && (
                  <TouchableOpacity
                    style={styles.imageWrapper}
                    onPress={() =>
                      navigation.navigate("ImagePreview", {
                        url: row.imageUrl,
                        part: null,
                        type: row.type,
                      })
                    }
                  >
                    <Image
                      source={{ uri: row.imageUrl }}
                      style={styles.rowImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      ) : (
        <Text style={styles.noDataText}>No damages reported</Text>
      )}
    </ScrollView>
  );
};

const currentKey = routes[index].key;
const currentRows = groupData[currentKey]?.rows || [];

// dynamic height
const tabHeight = Math.max(1, currentRows.length) * 100+60;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff",}} edges={['bottom','top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={"black"} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{car.name || ""}</Text>
        </View>
       
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Image slider */}
        <View>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item.url }} style={styles.image} />
            )}
            onScroll={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / width
              );
              setActiveIndex(index);
            }}
          />
          <View style={styles.counterBox}>
            <Text style={styles.counterText}>
              {activeIndex + 1}/{images.length}
            </Text>
          </View>
        </View>

        {/* Pills */}
        <View style={styles.detailRow}>
          {car.km ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{car.km} km</Text>
            </View>
          ) : null}
          {car.numberOfOwners ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{car.numberOfOwners} owner</Text>
            </View>
          ) : null}
          {car.fuelType ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{car.fuelType}</Text>
            </View>
          ) : null}
        </View>

        {/* Price box */}
        <View style={styles.priceBox}>
          <Text style={styles.priceText}>
            ₹{" "}
            {inspection.closingPrice
              ? inspection.closingPrice.toLocaleString("en-IN")
              : ""}
          </Text>
          <Text style={styles.priceLabel}>Closing price</Text>
        </View>

        {/* Location */}
        <Text style={styles.locationText}>
          {car.regCity && car.regState
            ? `${car.regCity} | ${car.regState}`
            : ""}
        </Text>
      <Text style={styles.sectionTitle}>Car Details</Text>
      <View style={styles.docsCard}>
      {Object.entries(car)
  .filter(([key]) => key !== "image" && key !== "mainImage" && key!=="chassisNumber")
  .map(([key, value]) => (
    <Row 
      key={key} 
      label={HUMAN_READABLE_LABELS[key] || key} 
      value={flattenValue(value)} 
    />
  ))
}

      </View>
        {/* Damage Tabs */}
       <View style={{ minHeight: tabHeight, marginTop: 20 }}>
  <TabView
    navigationState={{ index, routes }}
    renderScene={renderScene}
    onIndexChange={setIndex}
    initialLayout={{ width }}
    renderTabBar={(props) => (
      <TabBar
        {...props}
        scrollEnabled
        indicatorStyle={{ backgroundColor: COLORS.primary }}
        style={{ backgroundColor: "#fff" }}
        activeColor={COLORS.primary}
        inactiveColor="#777"
        labelStyle={{ fontSize: 12, textTransform: "none" }}
      />
    )}
  />
</View>
{/* Application ID */}
<View style={styles.appIdRow}>
  <Text style={styles.appIdText}>APPOINTMENT ID: {inspection.apptId}</Text>
  <TouchableOpacity
    onPress={async () => {
      await Clipboard.setStringAsync(inspection.apptId);
      Alert.alert("Copied!", "Application ID copied to clipboard.");
    }}
  >
    <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
  </TouchableOpacity>
</View>

      </ScrollView>
      <View style={styles.bottomButtonsContainer}>
      <TouchableOpacity
  style={[
    styles.oneClickBuyButton,
    (alreadyPurchased || submitting) && { backgroundColor: "#ccc" },
  ]}
  onPress={handleOneClickBuy}
  disabled={alreadyPurchased || submitting}
>
  <Text style={styles.oneClickBuyText}>
    {alreadyPurchased
      ? "Already Purchased"
      : submitting
      ? "Processing..."
      : `One Click Buy @ Rs. ${inspection?.closingPrice?.toLocaleString("en-IN")}`}
  </Text>
</TouchableOpacity>
{ submitting?"": <TouchableOpacity
          style={styles.bestPriceButton}
         onPress={() => setBestPriceModalVisible(true)}
        >
          <Text style={styles.bestPriceText}>GIVE YOUR BEST PRICE!</Text>
        </TouchableOpacity>}
       
      </View>
         <Modal
        visible={bestPriceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBestPriceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Your Best Price</Text>
      
            <Text style={styles.modalPrice}>
              ₹ {quotedPrice.toLocaleString("en-IN")}
            </Text>
      <View style={{ width: "100%", paddingVertical: 20 }}>
        <Slider
          minimumValue={parseInt(inspection?.minPrice ?? 0, 10)}
          maximumValue={parseInt(inspection?.maxPrice ?? 1000000, 10)}
          step={1000}
          value={quotedPrice}
          onValueChange={setQuotedPrice}
          minimumTrackTintColor="#FF6B35"
          maximumTrackTintColor="#ddd"
          thumbTintColor="#FF6B35"
          style={{ width: "100%", height: 40 }}
        />
      </View>
            <TouchableOpacity
              style={[styles.oneClickBuyButton, submitting && { backgroundColor: "#ccc" }]}
              onPress={handleBestPriceBuy}
              disabled={submitting}
            >
              <Text style={styles.oneClickBuyText}>
                {submitting ? "Processing..." : `Buy @ ₹${quotedPrice.toLocaleString("en-IN")}`}
              </Text>
            </TouchableOpacity>
      
            <TouchableOpacity onPress={() => setBestPriceModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
const Row = ({ label, value }) => {
  let displayValue = value;

  if (label === "Registration Number" && typeof value === "string") {
    const len = value.length;
    if (len > 4) {
      displayValue = value.slice(0, len - 4) + "****";
    }
  }

  return (
    <View style={styles.docRow}>
      <Text style={styles.docKey}>{label}</Text>
      <Text
        style={[
          styles.docValue,
          value?.toLowerCase() === "lost" || value?.toLowerCase() === "no"
            ? styles.redText
            : styles.greenText,
        ]}
      >
        {displayValue.toUpperCase()}
      </Text>
    </View>
  );
};


// Loader Component

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.white,
  },
  backButton: { paddingRight: 10 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },

  image: { width, height: 220, resizeMode: "cover" },

  counterBox: {
    position: "absolute",
    right: 16,
    bottom: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: { color: "#fff", fontSize: 13 },

  detailRow: {
    flexDirection: "row",
    marginTop: 12,
    marginLeft: 12,
  },
  pill: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
  },
  pillText: { fontSize: 13, color: "#333", fontWeight: "500" },

  priceBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginHorizontal: 12,
    borderRadius: 4,
    overflow: "hidden",
  },
  priceText: {
    backgroundColor: "#1a237e",
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  priceLabel: {
    backgroundColor: "#e3f2fd",
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  locationText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 12,
    marginTop: 12,
  },

  /* Damage Tab Table */
  scene: { flex: 1, backgroundColor: "#fff" },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
  },
  headerRow: { backgroundColor: "#f1f1f1", borderTopWidth: 1 },
  cell: { paddingHorizontal: 6, fontSize: 14 },
  partCol: { flex: 2 },
  statusCol: { flex: 1, justifyContent: "center" },
  remarkCol: { flex: 3 },
  noDataText: { margin: 16, fontSize: 14, color: "#555" },
  rowImage: {
    width: 40,
    height: 40,
    marginTop: 6,
    borderRadius: 6,
backgroundColor: "#eee"
  },
    sectionTitle: { fontSize: 16, fontWeight: "700", margin: 16 },
  docsCard: { marginHorizontal: 16, marginBottom: 16, padding: 12, backgroundColor: "#f9f9f9", borderRadius: 8, elevation: 3 },
  docRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  docKey: { fontSize: 14, color: "#555" },
  docValue: { fontSize: 12, fontWeight: "600" },
  imageWrapper: { width: "23%", alignItems: "center", marginBottom: 12 },
appIdRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginHorizontal: 16,
  marginVertical: 12,
  padding: 12,
  backgroundColor: "#f1f1f1",
  borderRadius: 8,
},
appIdText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#333",
},
  oneClickBuyButton: {
    backgroundColor: '#ff3131',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  oneClickBuyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bestPriceButton: {
    alignItems: 'center',
  },
  bestPriceText: {
    color: '#ff3131',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },modalOverlay: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "rgba(0,0,0,0.5)",
},
modalContent: {
  width: "85%",
  backgroundColor: "white",
  borderRadius: 12,
  padding: 20,
  alignItems: "center",
},
modalTitle: {
  fontSize: 18,
  fontWeight: "600",
  marginBottom: 16,
},
modalPrice: {
  fontSize: 22,
  fontWeight: "700",
  color: "#2E7D32",
  marginBottom: 12,
},
cancelText: {
  marginTop: 12,
  color: "#ff3131",
  fontWeight: "600",
},
});

export default CarDetailsScreen;
