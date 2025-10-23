import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../styles/colors';
import auth from '@react-native-firebase/auth'; // ✅ RN Firebase
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../redux/userSlice';


const AccountScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  // Get user from Redux store
  const userData = useSelector((state) => state.user.user) || {
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    companyName: '',
    gstNumber: '',
    phoneNumber: '',
    uid: '',
  };
  console.log(userData)

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={32} color={COLORS.blue} />
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>
                {userData.firstName || 'First Name'} {userData.lastName || 'Last Name'}
              </Text>
              {userData.companyName ? (
                <Text style={styles.profileName}>{userData.companyName}</Text>
              ) : null}
              <Text style={styles.profilePhone}>
                {userData.phoneNumber || 'Phone Number'}
              </Text>
              <Text style={styles.profileId}>ID: {userData.id || '1001'}</Text>
            </View>
            <TouchableOpacity style={styles.profileArrow}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {/* Extra user details */}
          <View style={styles.extraDetails}>
            <Text style={styles.detailItem}>Email: {userData.email || '-'}</Text>
            <Text style={styles.detailItem}>Address: {userData.address || '-'}</Text>
            <Text style={styles.detailItem}>City: {userData.city || '-'}</Text>
            <Text style={styles.detailItem}>State: {userData.state || '-'}</Text>
            <Text style={styles.detailItem}>Pincode: {userData.pincode || '-'}</Text>
            <Text style={styles.detailItem}>GST Number: {userData.gstNumber || '-'}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {navigation.navigate("ContactUs")}}
          >
            <View style={styles.menuIcon}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={COLORS.gray}
              />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Carsbazar updates</Text>
              <Text style={styles.menuSubtitle}>View updates</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          {/* Logout */}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: COLORS.text },
  headerRight: { width: 40, alignItems: 'flex-end' },
  scrollView: { flex: 1 },
  profileCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    ...SHADOWS.small,
  },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileDetails: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '600', color: COLORS.text, lineHeight: 22 },
  profilePhone: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  profileId: { fontSize: 14, color: COLORS.gray },
  profileArrow: { padding: 8 },
  extraDetails: { marginTop: 12 },
  detailItem: { fontSize: 14, color: COLORS.gray, marginBottom: 4 },
  menuContainer: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    ...SHADOWS.small,
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

export default AccountScreen;
