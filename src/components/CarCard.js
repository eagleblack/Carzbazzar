import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../styles/colors";

const { width } = Dimensions.get("window");

const CarCard = ({ car, onPress }) => {
  const {
    name,
    variant,
    yearOfManufacturing,
    city,
    km,
    owner,
    fuelType,
    images,
    closingPrice,
    fairMarketValue,
    model,
  } = car;

  const [liked, setLiked] = useState(false);

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "N/A";
    return `₹ ${Number(amount).toLocaleString("en-IN")}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.92}
    >
      {/* 🔹 Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              images?.[0] ||
              "https://via.placeholder.com/400x250?text=Car+Image",
          }}
          style={styles.carImage}
        />
        {/* Gradient Overlay */}
        <View style={styles.gradientOverlay} />

        {/* Brand Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>CARZBAZZAR</Text>
        </View>

        {/* City Tag */}
        {city && (
          <View style={styles.locationTag}>
            <Ionicons name="location-outline" size={14} color="#fff" />
            <Text style={styles.locationText} numberOfLines={1}>
              {city}
            </Text>
          </View>
        )}

        {/* Image Counter */}
        <View style={styles.imageCounter}>
          <Ionicons name="images-outline" size={14} color="#fff" />
          <Text style={styles.imageCounterText}>{images?.length || 1}</Text>
        </View>
      </View>

      {/* 🔹 Car Info */}
      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.carName} numberOfLines={1}>
            {name}
          </Text>
          <TouchableOpacity onPress={() => setLiked(!liked)}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={25}
              color={liked ? "red" : "#6b7280"}
            />
          </TouchableOpacity>
        </View>

        {variant && (
          <Text style={styles.variant} numberOfLines={1}>
            {variant}
          </Text>
        )}

        {/* Specs */}
        <View style={styles.specsRow}>
          {yearOfManufacturing && (
            <SpecChip icon="calendar-outline" text={yearOfManufacturing} />
          )}
          {km && <SpecChip icon="speedometer-outline" text={`${km} km`} />}
          {owner && <SpecChip icon="person-outline" text={`${owner} Owner`} />}
          {fuelType && <SpecChip icon="flame-outline" text={fuelType} />}
          {model && <SpecChip icon="star" text={model} />}
        </View>
      </View>

      {/* 🔹 Pricing */}
      <View style={styles.pricingSection}>
        {closingPrice !== undefined && (
          <View style={styles.priceTag}>
            <Text style={styles.priceLabel}>Closing Price</Text>
            <Text style={styles.priceValue}>
              {formatCurrency(closingPrice)}
            </Text>
          </View>
        )}
        {fairMarketValue !== undefined && (
          <View style={styles.fmvBox}>
            <Ionicons name="flash" size={16} color={COLORS.orange} />
            <Text style={styles.fmvLabel}>FMV:</Text>
            <Text style={styles.fmvValue}>
              {formatCurrency(fairMarketValue)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

/* 🔹 Mini reusable component */
const SpecChip = ({ icon, text }) => (
  <View style={styles.specChip}>
    <Ionicons name={icon} size={12} color="black" />
    <Text style={styles.specChipText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
 container: {
  backgroundColor: "#fff",
  borderRadius: 20,
  marginHorizontal: 16,
  marginBottom: 24,
  overflow: "hidden",
  borderWidth: 1,                 // ✅ add border
  borderColor: "rgba(0,0,0,0.08)", // ✅ soft gray border
  ...SHADOWS.large,
},

  imageContainer: {
    height: 220,
    position: "relative",
  },
  carImage: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  badge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    ...SHADOWS.small,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  locationTag: {
    position: "absolute",
    bottom: 16,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  locationText: {
    color: "#fff",
    fontSize: 13,
    marginLeft: 4,
    fontWeight: "600",
  },
  imageCounter: {
    position: "absolute",
    bottom: 16,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "600",
  },
  detailsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,

  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
        marginBottom:10
  },
  carName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 6,
    flex: 1,
    marginRight: 10,
  },
  variant: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 10,
  },
  specsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  specChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d4e5ffff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius:2,
    marginBottom: 8,
  },
  specChipText: {
    fontSize: 11,
    color: "black",
    marginLeft: 6,
    fontWeight: "600",
  },
  pricingSection: {
    padding: 16,
    flexDirection: "column",
    gap: 12,
  },
  priceTag: {
  backgroundColor:'#00008B',
    borderRadius: 12,
    padding: 14,
  },
  priceLabel: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 2,
  },
  priceValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  fmvBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fmvLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 6,
    marginRight: 4,
  },
  fmvValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
});

export default CarCard;
