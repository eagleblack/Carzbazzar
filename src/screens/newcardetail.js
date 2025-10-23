import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Alert } from "react-native";
import auth from "@react-native-firebase/auth"; // to get current user
import { Modal } from "react-native";
import Slider from "@react-native-community/slider";


import firestore, { FieldValue } from "@react-native-firebase/firestore";
import { componentLabelMap } from "../utils/componentLabels";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../styles/colors";

function getReadableLabel(key) {
  return componentLabelMap[key] || formatLabel(key);
}
function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1") // split camelCase
    .replace(/[_-]/g, " ")      // replace _ and -
    .replace(/\s+/g, " ")       // collapse spaces
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase()); // capitalize first letter
}

function getStatus(remark) {
  if (remark && remark.trim().length > 0) {
    return { status: "no", icon: "close-circle", color: "red" };
  }
  return { status: "yes", icon: "checkmark-circle", color: "green" };
}
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

const CarDetailsScreen = ({ navigation,route }) => {
  const  {inspectionId} = route.params; 

  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
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
              const querySnapshot = await firestore()
                .collection("inspections")
                .where("inspectionId", "==", inspectionId)
                .limit(1)
                .get();

              if (querySnapshot.empty) throw new Error("Inspection not found");

              const inspectionDoc = querySnapshot.docs[0];
              const inspectionRef = inspectionDoc.ref;

              const userRef = firestore().collection("users").doc(currentUser.uid);
              const userDoc = await transaction.get(userRef);

              if (!userDoc.exists) throw new Error("User not found");

              const userData = userDoc.data();

              const buyer = {
                uid: currentUser?.uid ?? "",
                fullName: `${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim(),
                email: userData?.email ?? currentUser?.email ?? "",
                phone: userData?.phone ?? "",
                purchasedAt: Date.now(),
                quotedPrice, // ✅ extra field
              };

              if ((userData.purchased || []).includes(inspectionId)) {
                throw new Error("Already purchased this car");
              }

              transaction.update(inspectionRef, {
                buyers: firestore.FieldValue.arrayUnion(buyer),
              });

              transaction.update(userRef, {
                purchased: firestore.FieldValue.arrayUnion(inspectionId),
              });
            });

            setBestPriceModalVisible(false);

            Alert.alert("Success", "Purchase submitted with your best price!", [
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
                phone: userData?.phone ?? "",
                purchasedAt: Date.now(), // 🔹 store as plain JS timestamp (ms)
                quotedPrice:inspection?.closingPrice
              };

              // prevent duplicates
              if ((userData.purchased || []).includes(inspectionId)) {
                throw new Error("Already purchased this car");
              }

              transaction.update(inspectionRef, {
                buyers: firestore.FieldValue.arrayUnion(buyer),
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
        .where("inspectionId", "==", inspectionId) // ✅ match by field instead of doc ID
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

  if (inspectionId) {
    fetchInspection();
  }
}, [inspectionId]);


  if (loading) return <Loader />;
  if (!inspection) return <NoData />;

  const car = inspection.sections.carDetails || {};

  // Build images
  const images = [];
  if (car.image?.url) images.push({ url: car.image.url, section: "Main" });
  ["Front", "Rear", "Left"].forEach((section) => {
    const secObj = inspection.sections?.[section];
    if (secObj) {
      Object.keys(secObj).forEach((key) => {
        const item = secObj[key];
        if (item?.image?.url) {
          images.push({
            url: item.image.url,
            remark: item.remark || null,
            section,
            key,
          });
        }
      });
    }
  });
  if (images.length === 0) images.push({ url: "https://via.placeholder.com/400x220?text=No+Image" });

  // Flatten car value for display
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

  // Gather damages from sections
const damages = [];

Object.entries(inspection.sections || {}).forEach(([section, secObj]) => {
  if (section === "carDetails") return;

  Object.entries(secObj).forEach(([key, item]) => {
    const remark =
      typeof item?.remark === "string"
        ? item.remark.trim()
        : typeof item?.image?.remark === "string"
        ? item.image.remark.trim()
        : "";

    damages.push({
      part: getReadableLabel(key),
      subpart: "-", // if you don’t have subparts yet
      remark,
    });
  });
});

  return (
    <SafeAreaView style={{flex:1}}>
    <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={"black"} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{car.year} {car.name}</Text>
          
        </View>
      
      </View>

    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom:130}}>
      {/* Image Slider */}
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
            {item.remark ? (
              <View style={styles.remarkOverlay}>
                <Text style={styles.remarkText}>{item.section} - {item.key} issue: {item.remark}</Text>
              </View>
            ) : null}
          </View>
        )}
      />

      {/* Car Title */}
    {/* Top Section */}
<View style={styles.topSection}>
  {/* Car Title */}
  <Text style={styles.variantText}>
    {car.yearOfManufacturing || car.registrationYear || ""}{" "}
    {car.model || ""} {car.variant || ""}
  </Text>

  {/* Detail Pills Row */}
  <View style={styles.detailRow}>
    <View style={styles.pill}>
      <Text style={styles.pillText}>{car.km ? `${car.km} km` : ""}</Text>
    </View>
    <View style={styles.pill}>
      <Text style={styles.pillText}>
        {car.numberOfOwners ? `${car.numberOfOwners} owner` : ""}
      </Text>
    </View>
    <View style={styles.pill}>
      <Text style={styles.pillText}>{car.fuelType || ""}</Text>
    </View>
  </View>

  {/* Closing Price */}
  <Text style={styles.priceText}>
    ₹ {inspection.closingPrice ? inspection.closingPrice.toLocaleString("en-IN") : ""}
  </Text>
  <Text style={styles.subPriceText}>Closing Price</Text>

  {/* Location */}
  <Text style={styles.locationText}>
    {car.regCity && car.regState ? `${car.regCity} | ${car.regState}` : ""}
  </Text>
</View>



      {/* Important Documents */}
    
      {/* Other Car Details */}
      <Text style={styles.sectionTitle}>Car Details</Text>
      <View style={styles.docsCard}>
      {Object.entries(car)
  .filter(([key]) => key !== "image" && key !== "mainImage")
  .map(([key, value]) => (
    <Row 
      key={key} 
      label={HUMAN_READABLE_LABELS[key] || key} 
      value={flattenValue(value)} 
    />
  ))
}

      </View>

      {/* Damages */}
   <Text style={styles.sectionTitle}>Damages</Text>

<View style={[styles.row, styles.headerRow]}>
  <Text style={[styles.cell, styles.partCol]}>Part</Text>
  <Text style={[styles.cell, styles.subpartCol]}>Subpart</Text>
  <Text style={[styles.cell, styles.statusCol]}>Status</Text>
  <Text style={[styles.cell, styles.remarkCol]}>Work Done / Current Condition</Text>
</View>

{damages.length > 0 ? (
  damages.map((row, i) => {
    const { icon, color } = getStatus(row.remark);
    return (
      <View
        key={i}
        style={[
          styles.row,
          { backgroundColor: i % 2 === 0 ? "#fff" : "#f9f9f9" },
        ]}
      >
        <Text style={[styles.cell, styles.partCol]}>{row.part}</Text>
        <Text style={[styles.cell, styles.subpartCol]}>{row.subpart}</Text>
        <View style={[styles.cell, styles.statusCol, { alignItems: "center" }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.cell, styles.remarkCol]}>
          {row.remark !== "" ? row.remark : "-"}
        </Text>
      </View>
    );
  })
) : (
  <Text style={{ marginLeft: 16 }}>No damages reported</Text>
)}
      {/* Buy Button */}
    
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
{alreadyPurchased || submitting?"": <TouchableOpacity
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

// Row Component
const Row = ({ label, value }) => (
  <View style={styles.docRow}>
    <Text style={styles.docKey}>{label}</Text>
    <Text style={[styles.docValue, value?.toLowerCase() === "lost" || value?.toLowerCase() === "no" ? styles.redText : styles.greenText]}>
      {value}
    </Text>
  </View>
);

// Loader Component
const Loader = () => (
  <View style={styles.centered}><ActivityIndicator size="large" color="#000" /></View>
);

// No Data Component
const NoData = () => (
  <View style={styles.centered}><Text>No data found</Text></View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  imageWrapper: { width, height: 220 },
  image: { width, height: 220 },
  remarkOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(255,0,0,0.6)", padding: 6 },
  remarkText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  infoContainer: { padding: 16 },
  carTitle: { fontSize: 18, fontWeight: "600" },
  price: { fontSize: 20, fontWeight: "700", color: "#2E7D32", marginVertical: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", margin: 16 },
  docsCard: { marginHorizontal: 16, marginBottom: 16, padding: 12, backgroundColor: "#f9f9f9", borderRadius: 8, elevation: 3 },
  docRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  docKey: { fontSize: 14, color: "#555" },
  docValue: { fontSize: 14, fontWeight: "600" },
  redText: { color: "red" },
  greenText: { color: "green" },
  damageRow: { marginHorizontal: 16, marginBottom: 8 },
  damagePart: { fontSize: 14, fontWeight: "bold" },
  damageIssue: { fontSize: 13, color: "#666" },
  buyButton: { backgroundColor: "#FF6F00", margin: 16, padding: 14, borderRadius: 8, alignItems: "center" },
  buyButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
   infoContainer: { padding: 16 },
  carTitle: { fontSize: 18, fontWeight: "600" },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E7D32",
    marginVertical: 8,
  },
    header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  carInfoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  locationContainer: { paddingHorizontal: 16, marginBottom: 10 },
  topSection: {
  backgroundColor: "#fff",
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
},
variantText: {
  fontSize: 16,
  fontWeight: "600",
  color: "#222",
  marginLeft: 12,
},
detailRow: {
  flexDirection: "row",
  justifyContent: "flex-start",
  marginTop: 8,
  marginLeft: 12,
},
pill: {
  backgroundColor: "#f0f0f0",
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 16,
  marginRight: 8,
},
pillText: {
  fontSize: 13,
  color: "#333",
  fontWeight: "500",
},
priceText: {
  fontSize: 20,
  fontWeight: "700",
  color: "#2E7D32",
  marginLeft: 12,
  marginTop: 10,
},
subPriceText: {
  fontSize: 13,
  color: "#777",
  marginLeft: 12,
  marginTop: 2,
},
locationText: {
  fontSize: 14,
  color: "#555",
  marginLeft: 12,
  marginTop: 6,
},
// Table
row: {
  flexDirection: "row",
  borderBottomWidth: 1,
  borderBottomColor: "#ddd",
  paddingVertical: 8,
},
headerRow: { backgroundColor: "#f1f1f1", borderTopWidth: 1 },
cell: { paddingHorizontal: 6, fontSize: 14 },
partCol: { flex: 2 },
subpartCol: { flex: 1 },
statusCol: { flex: 1, justifyContent: "center" },
remarkCol: { flex: 3 },
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  oneClickBuyButton: {
    backgroundColor: '#FF6B35',
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
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
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
  color: "#FF6B35",
  fontWeight: "600",
},

});

export default CarDetailsScreen;


