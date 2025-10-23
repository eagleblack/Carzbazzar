import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
  PermissionsAndroid,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import SearchBar from '../components/SearchBar';
import CarCard from '../components/CarCard';
import { COLORS } from '../styles/colors';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';

import { saveFcmToken } from '../utils/saveFcmToken';

const { width } = Dimensions.get('window');
const NOTIFICATION_ATTEMPTS_KEY = 'notificationAttempts';

// 🔹 Dummy data for slider
const SLIDER_DATA = [
  {
    id: '1',
    image: require('../assest/1758918666747.jpg'),
  },
  {
    id: '2',
    image: require('../assest/slider2.png'),
  },
];

// 🔹 Dummy tab filters
const FILTER_TABS = ['1ST OWNER', '2+ OWNER', 'PETROL', 'DIESEL', 'CNG'];

const HomeScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cars, setCars] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState(null); // default → no filter

  // 🔹 Fetch inspections in realtime
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('inspections')
      .where('status', '==', 'approved')
       .orderBy("createdAt", "desc") // ✅ newest first
.onSnapshot((snapshot) => {
  if (!snapshot || !snapshot.docs) return; // ❌ prevent crash

  const list = snapshot.docs.map((doc) => {
    const data = doc.data();
    const details = data.sections?.carDetails || {};

    return {
      id: doc.id,
      name: details.name ?? 'Unknown Car',
      registrationNumber: details.registrationNumber ?? '',
      yearOfManufacturing: details.yearOfManufacturing ?? '',
      registrationYear: details.registrationYear ?? '',
      city: details.regCity ?? '',
      fuelType: (details.fuelType ?? '').trim(),
      km: details.km ?? '',
      numberOfOwners: details.numberOfOwners?.trim?.() ?? '',
      closingPrice: data.closingPrice ?? 0,
      mainImage: details.image?.url ?? null,
      status: data.status,
      inspectionId: data.inspectionId,
      apptId: data.apptId,
      model: details.model ?? '',
    };
  });

  setCars(list);
})

    return () => unsubscribe();
  }, []);

  // 🔹 Check and save notification token (Android only)
  useEffect(() => {
    const checkNotificationPermission = async () => {
      if (Platform.OS !== 'android') return;
      const user = auth().currentUser;
      if (!user) return;

      try {
        let granted = true;

        if (Platform.Version >= 33) {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          granted = result === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (granted) {
          await saveFcmToken(user.uid);
        } else {
          let attempts = parseInt(
            await AsyncStorage.getItem(NOTIFICATION_ATTEMPTS_KEY),
            10
          );
          if (isNaN(attempts)) attempts = 0;

          if (attempts === 0 || attempts % 10 === 0) {
            showNotificationPrompt(user.uid);
          }

          await AsyncStorage.setItem(
            NOTIFICATION_ATTEMPTS_KEY,
            (attempts + 1).toString()
          );
        }
      } catch (err) {
        console.log('Error handling notification attempts:', err);
      }
    };

    const showNotificationPrompt = (userId) => {
      Alert.alert(
        'Enable Notifications',
        'Turn on notifications to get instant updates when new cars are approved.',
        [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              try {
                const result = await PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                );
                if (result === PermissionsAndroid.RESULTS.GRANTED) {
                  await saveFcmToken(userId);
                }
              } catch (e) {
                console.log('Notification permission denied:', e);
              }
            },
          },
        ]
      );
    };

    checkNotificationPermission();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCarPress = (car) => {
    navigation.navigate('CarDetails', { inspectionId: car?.inspectionId });
  };

  const handleBidPress = (car) => {
    console.log('Bid pressed for:', car.name);
  };

  const maskRegistrationNumber = (regNum) => {
    if (!regNum) return '';
    if (regNum.length <= 4) return regNum;
    return regNum.slice(0, -4).replace(/./g, '*') + regNum.slice(-4);
  };

  // 🔹 Apply search + filters
  const filteredCars = cars
    .filter(
      (car) =>
        car?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.apptId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((car) => {
      if (!activeTab) return true;

      switch (activeTab) {
        case '1ST OWNER':
          return String(car.numberOfOwners) === '1';
       case '2+ OWNER':
  return String(car.numberOfOwners)=='2' || String(car.numberOfOwners)=="3" || String(car.numberOfOwners)=="4";

      case 'PETROL':
  return car.fuelType?.toLowerCase().includes('petrol');
case 'DIESEL':
  return car.fuelType?.toLowerCase().includes('diesel');
case 'CNG':
  return car.fuelType?.toLowerCase().includes('cng');

        default:
          return true;
      }
    });

  const resetFilters = () => {
    setActiveTab(null);
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar onSearch={handleSearch} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* 🔹 Image Slider */}
        <FlatList
          data={SLIDER_DATA}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const slide = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveSlide(slide);
          }}
          renderItem={({ item }) => (
            <Image source={item.image} style={styles.sliderImage} />
          )}
        />

        <View style={styles.dotsContainer}>
          {SLIDER_DATA.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, activeSlide === index && styles.activeDot]}
            />
          ))}
        </View>

        {/* 🔹 Filter & Sort */}
        <View style={styles.filterSortRow}>
          <TouchableOpacity style={styles.filterSortBtn}>
            <Ionicons name="filter-outline" size={18} color={COLORS.text} />
            <Text style={styles.filterSortText}>Filter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterSortBtn}>
            <Ionicons name="swap-vertical-outline" size={18} color={COLORS.text} />
            <Text style={styles.filterSortText}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* 🔹 Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsRow}
        >
          {FILTER_TABS.map((tab) => (
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
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 🔹 Show active filter with cross button */}
        {activeTab && (
          <View style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>{activeTab}</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* 🔹 Cars Section */}
        <View style={styles.carsSection}>
          <Text style={styles.sectionTitle}>One Click Buy cars</Text>

          {filteredCars.map((car, index) => (
            <CarCard
              key={`${car.id}-${index}`}
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
                model: car.model,
              }}
              onPress={() => handleCarPress(car)}
              onBidPress={() => handleBidPress(car)}
            />
          ))}

          {filteredCars.length === 0 && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No cars found</Text>
              <Text style={styles.noResultsSubtext}>
                Try adjusting your search or filters
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  sliderImage: {
    width: width,
    height: 180,
    resizeMode: 'cover',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#333',
  },
  filterSortRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterSortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
  },
  filterSortText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    marginRight: 10,
  },
  activeTab: {
    backgroundColor: '#333',
  },
  tabText: {
    fontSize: 14,
    color: '#555',
  },
  activeTabText: {
    color: '#fff',
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    alignSelf: 'flex-start',
    backgroundColor: '#f9f9f9',
    gap: 6,
  },
  activeFilterText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  carsSection: {
    paddingTop: 16,
  },
  sectionTitle: {
    paddingTop: 10,
    paddingHorizontal: -20,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default HomeScreen;
