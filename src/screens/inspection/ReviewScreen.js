import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { componentLabelMap } from "../../utils/componentLabels";

// 🔹 Convert camelCase or snake_case to Pretty Label
function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function getReadableLabel(key) {
  return componentLabelMap[key] || formatLabel(key);
}

// 🔹 Extract remark from part data
function extractRemark(partData) {
  if (typeof partData?.remark === "string") return partData.remark.trim();
  if (typeof partData?.image?.remark === "string") return partData.image.remark.trim();
  return "";
}

// 🔹 Extract image URL from part data
function extractImageUrl(partData) {
  if (typeof partData?.image === "string") return partData.image;
  if (typeof partData?.image?.url === "string") return partData.image.url;
  return null;
}

// 🔹 Extract image type from part data
function extractImageType(partData) {
  if (typeof partData?.image?.type === "string") return partData.image.type;
  if (typeof partData?.image === "string" || partData?.image?.url) return "image";
  return null;
}

// 🔹 Determine status based on remark
function getStatus(remark) {
  if (remark && remark.trim().length > 0) {
    return { status: "No", icon: "close-circle", color: "red" };
  }
  return { status: "Yes", icon: "checkmark-circle", color: "green" };
}

export default function ReviewScreen({ route, navigation }) {
  const { inspectionId } = route.params;
  const inspection = useSelector(
    (state) => state.inspections.byId?.[inspectionId]
  );

  if (!inspection) {
    return (
      <View style={styles.container}>
        <Text style={{ padding: 16 }}>Inspection not found.</Text>
      </View>
    );
  }

  const exteriorSections = ["Front", "Rear", "Left", "Right"];
  const sections = [];
  const allImages = [];

  // 🔹 Exterior + Tyres
  const exteriorRows = [];
  exteriorSections.forEach((sec) => {
    const parts = inspection.sections?.[sec];
    if (parts) {
      Object.entries(parts).forEach(([partName, partData]) => {
        const remark = extractRemark(partData);
        const imgUrl = extractImageUrl(partData);
        const type = extractImageType(partData);

        if (imgUrl) allImages.push({ part: partName, url: imgUrl, type });
        exteriorRows.push({ part: partName, subpart: "-", remark, type });
      });
    }
  });
  if (exteriorRows.length > 0) sections.push({ sectionName: "Exterior + Tyres", rows: exteriorRows });

  // 🔹 Other sections
  Object.entries(inspection.sections || {}).forEach(([sectionName, parts]) => {
    if (exteriorSections.includes(sectionName) || sectionName === "carDetails") return;

    const rows = Object.entries(parts).map(([partName, partData]) => {
      const remark = extractRemark(partData);
      const imgUrl = extractImageUrl(partData);
      const type = extractImageType(partData);

      if (imgUrl) allImages.push({ part: partName, url: imgUrl, type });
      return { part: partName, subpart: "-", remark, type };
    });

    if (rows.length > 0) sections.push({ sectionName, rows });
  });

  // 🔹 Car details
  const carDetails = inspection.sections?.carDetails || {};
  const mainImageUrl = typeof carDetails.image === "string" ? carDetails.image : carDetails.image?.url || carDetails.image?.localPath || null;
  const mainImageType = extractImageType(carDetails);

  if (mainImageUrl) allImages.push({ part: "mainImage", url: mainImageUrl, type: mainImageType });

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inspection Review</Text>
      </View>

      {/* Car Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Car Details</Text>
        {mainImageUrl && <Image source={{ uri: mainImageUrl }} style={styles.mainImage} />}
        <View style={styles.detailTable}>
          {Object.entries(carDetails).map(([key, value]) => {
            if (key === "image" || value == null) return null;
            return (
              <View key={key} style={styles.detailRow}>
                <Text style={styles.detailKey}>{formatLabel(key)}</Text>
                <Text style={styles.detailValue}>{String(value)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Sections */}
      {sections.map((section, idx) => (
        <View key={idx} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.sectionName}</Text>

          {/* Table Header */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.partCol]}>Part</Text>
            <Text style={[styles.cell, styles.subpartCol]}>Subpart</Text>
            <Text style={[styles.cell, styles.statusCol]}>Status</Text>
            <Text style={[styles.cell, styles.remarkCol]}>Work Done / Current Condition</Text>
          </View>

          {/* Table Rows */}
          {section.rows.map((row, i) => {
            const { icon, color } = getStatus(row.remark);
            return (
              <View
                key={i}
                style={[
                  styles.row,
                  { backgroundColor: i % 2 === 0 ? "#fff" : "#f9f9f9" },
                ]}
              >
                <Text style={[styles.cell, styles.partCol]}>{getReadableLabel(row.part)}</Text>
                <Text style={[styles.cell, styles.subpartCol]}>{row.subpart}</Text>
                <View style={[styles.cell, styles.statusCol, { alignItems: "center" }]}>
                  <Ionicons name={icon} size={20} color={color} />
                </View>
                <Text style={[styles.cell, styles.remarkCol]}>{row.remark !== "" ? row.remark : "-"}</Text>
              </View>
            );
          })}
        </View>
      ))}

      {/* Image Gallery */}
      {allImages.length > 0 && (
        <View style={styles.gallerySection}>
          <Text style={styles.sectionTitle}>All Images</Text>
          <View style={styles.imageGrid}>
            {allImages.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.imageWrapper}
                onPress={() => navigation.navigate("ImagePreview", { url: item.url, part: item.part, type: item.type })}
              >
                <Image source={{ uri: item.url }} style={styles.imageThumb} />
                <Text style={styles.imageLabel} numberOfLines={1}>
                  {getReadableLabel(item.part)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  headerTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", padding: 8, backgroundColor: "#eef3ff" },
  mainImage: { width: 140, height: 200, resizeMode: "contain", marginBottom: 12, alignSelf: "center" },
  detailTable: { borderWidth: 1, borderColor: "#ddd" },
  detailRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", padding: 8 },
  detailKey: { flex: 1, fontWeight: "bold", fontSize: 14 },
  detailValue: { flex: 2, fontSize: 14 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ddd", paddingVertical: 8 },
  headerRow: { backgroundColor: "#f1f1f1", borderTopWidth: 1 },
  cell: { paddingHorizontal: 6, fontSize: 14 },
  partCol: { flex: 2 },
  subpartCol: { flex: 1 },
  statusCol: { flex: 1, justifyContent: "center" },
  remarkCol: { flex: 3 },
  gallerySection: { marginBottom: 24 },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", padding: 8, gap: 8 },
  imageWrapper: { width: "23%", alignItems: "center", marginBottom: 12 },
  imageThumb: { width: 50, height: 50, borderRadius: 6, backgroundColor: "#eee" },
  imageLabel: { fontSize: 10, textAlign: "center", marginTop: 4 },
});
