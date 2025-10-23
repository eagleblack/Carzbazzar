import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSelector } from "react-redux";
import firestore from "@react-native-firebase/firestore";
import CarCard from "../components/CarCard";
import { COLORS } from "../styles/colors";

const OrdersScreen = ({ navigation }) => {
  const user = useSelector((state) => state.user.user);
  const [purchases, setPurchases] = useState([]);
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const purchasedIds = user?.purchased ?? [];
        const negotiatedArray = user?.negotiated ?? []; // [{inspectionId, quotedPrice, purchasedAt}, ...]

        const inspectionIds = [
          ...purchasedIds,
          ...negotiatedArray.map((n) => n.inspectionId),
        ];

        if (inspectionIds.length === 0) {
          setPurchases([]);
          setNegotiations([]);
          setLoading(false);
          return;
        }

        // Fetch all cars for both purchased & negotiated
        const snapshot = await firestore()
          .collection("inspections")
          .where("inspectionId", "in", inspectionIds)
          .get();

        const docsMap = new Map(
          snapshot.docs.map((doc) => [doc.data().inspectionId, { id: doc.id, ...doc.data() }])
        );

        // Purchases
        const purchaseList = purchasedIds.map((id) => {
          const data = docsMap.get(id);
          if (!data) return null;

          const details = data.sections?.carDetails || {};
          return {
             id: data.id,
            name: details.name ?? 'Unknown Car',
            registrationNumber: details.registrationNumber ?? '',
            yearOfManufacturing: details.yearOfManufacturing ?? '',
            registrationYear: details.registrationYear ?? '',
            city: details.regCity ?? '',
            fuelType: details.fuelType ?? '',
            km: details.km ?? '',
            numberOfOwners: details.numberOfOwners ?? '',
            closingPrice: data.closingPrice ?? 0,
            mainImage: details.image?.url ?? null,
            status: data.status,
            inspectionId: data.inspectionId,
            apptId: data.apptId,
            model: details.model ?? '',
          };
        }).filter(Boolean);

        // Negotiations
        const negotiationList = negotiatedArray.map((neg) => {
          const data = docsMap.get(neg.inspectionId);
          if (!data) return null;

          const details = data.sections?.carDetails || {};
          return {
            id: data.id,
         name: details.name ?? 'Unknown Car',
            registrationNumber: details.registrationNumber ?? '',
            yearOfManufacturing: details.yearOfManufacturing ?? '',
            registrationYear: details.registrationYear ?? '',
            city: details.regCity ?? '',
            fuelType: details.fuelType ?? '',
            km: details.km ?? '',
            numberOfOwners: details.numberOfOwners ?? '',
            closingPrice: data.closingPrice ?? 0,
            mainImage: details.image?.url ?? null,
            status: data.status,
            inspectionId: data.inspectionId,
            apptId: data.apptId,
            model: details.model ?? '',
          };
        }).filter(Boolean);

        setPurchases(purchaseList);
        setNegotiations(negotiationList);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const maskRegistrationNumber = (regNum) => {
    if (!regNum) return "";
    if (regNum.length <= 4) return regNum;
    return regNum.slice(0, -4).replace(/./g, "*") + regNum.slice(-4);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 6 }}>
        {purchases.length === 0 && negotiations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No orders yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Your purchased and negotiated cars will appear here
            </Text>
          </View>
        ) : (
          <>
            {purchases.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>My Purchases</Text>
                {purchases.map((car, index) => (
                  <CarCard
                    key={`purchase-${car.id}-${index}`}
                    car={{
                      ...car,
                      id: maskRegistrationNumber(car.registrationNumber),
                      images: [car.mainImage],
                    }}
                    onPress={() => navigation.navigate("CarDetails", { inspectionId: car?.inspectionId })}
                  />
                ))}
              </>
            )}

            {negotiations.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>My Negotiations</Text>
                {negotiations.map((car, index) => (
                  <CarCard
                    key={`neg-${car.id}-${index}`}
                    car={{
                ...car,
                id: maskRegistrationNumber(car.registrationNumber),
                highestBid: undefined,
                closingPrice: car.closingPrice,
                images: [car.mainImage],
                fairMarketValue: undefined,
                city: car.city,
                fuelType: car.fuelType,
                km: car.km,
                owner: car.numberOfOwners,
              }}
                    onPress={() => navigation.navigate("CarDetails", { inspectionId: car?.inspectionId })}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: "center",
  },
});

export default OrdersScreen;
