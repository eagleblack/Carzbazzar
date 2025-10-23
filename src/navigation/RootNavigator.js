import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useDispatch, useSelector } from "react-redux";
import auth from "@react-native-firebase/auth";
import SplashScreen from "react-native-splash-screen";
import messaging from '@react-native-firebase/messaging';
import { fetchUser, listenToUser, clearUser } from "../redux/userSlice";
import { processUploadQueue } from "../redux/inspectionSlice";
import { navigationRef, navigate } from "../utils/navigationService"; // 🔹 createNavigationContainerRef helper

// Screens
import PhoneLoginScreen from "../screens/PhoneLoginScreen";
import OTPVerificationScreen from "../screens/OTPVerificationScreen";
import PersonalDetailsScreen from "../screens/PersonalDetailsScreen";
import InspectionLoginScreen from "../screens/InspectionLoginScreen";
import TermsOfServiceScreen from "../screens/TermsOfServiceScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import MainAppNavigator from "../components/MainAppNavigator";
import {
  InspectionScreen,
  CarDetailsInspection,
} from "../screens/inspection";
import ExteriorTyresInspection from "../screens/inspection/ExteriorTyresInspection";
import ElectricalInteriorInspection from "../screens/inspection/ElectricalInteriorInspection";
import EngineTransmissionInspection from "../screens/inspection/EngineTransmissionInspection";
import SteeringSuspensionBrakesInspection from "../screens/inspection/SteeringSuspensionBrakesInspection";
import AirConditioningInspection from "../screens/inspection/AirConditioningInspection";
import ComponentIssueScreen from "../screens/inspection/ComponentIssueScreen";
import ReviewScreen from "../screens/inspection/ReviewScreen";
import ImagePreview from "../screens/inspection/ImageViewer";
import CarDetailsScreen from "../screens/CarDetailsScreen";
import ContactUsScreen from "../screens/ContactUsScreen";
import InspectionScreenMain from "../screens/inspection/InspectionScreenMain";
import PushNotification from "react-native-push-notification";

const Stack = createStackNavigator();

export default function RootNavigator() {
  const dispatch = useDispatch();
  const { user, loading: userLoading } = useSelector((state) => state.user);
const [initialNotification, setInitialNotification] = useState(null);

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
useEffect(() => {
  PushNotification.createChannel(
    {
      channelId: "default-channel", // must match channelId in showNotification
      channelName: "Default Channel",
      importance: 4, // High importance
      vibrate: true,
    },
    (created) => console.log(`createChannel returned '${created}'`)
  );
}, []);
useEffect(() => {
  const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
    console.log('Foreground FCM:', remoteMessage);

    PushNotification.localNotification({
      channelId: "default-channel",
      title: remoteMessage.notification?.title || "New Notification",
      message: remoteMessage.notification?.body || "You have a new message",
      bigText: remoteMessage.notification?.body,
      playSound: true,
      soundName: "default",
      importance: "high",
      priority: "high",
      userInfo: remoteMessage.data, // 🔹 keep data for navigation
    });
  });


 messaging().getInitialNotification().then(remoteMessage => {
    if (remoteMessage) {
      console.log('Notification caused app open from quit:', remoteMessage);
      setInitialNotification(remoteMessage); // store it for onReady
    }
  });

  return () => {
   
    unsubscribeForeground();
  };
}, []);

  useEffect(() => {
    dispatch(processUploadQueue());
  }, [dispatch]);

  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        await dispatch(fetchUser());
        dispatch(listenToUser());
      } else {
        dispatch(clearUser());
      }

      setAuthLoading(false);
    });

    return unsubscribeAuth;
  }, [dispatch]);

  useEffect(() => {
    if (!authLoading && !userLoading) {
      SplashScreen.hide();
    }
  }, [authLoading, userLoading]);

  if (authLoading || userLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
<NavigationContainer
  ref={navigationRef}
  onReady={() => {
    if (initialNotification?.data?.screen === "CardetailsScreen") {
      navigate("CarDetails", {
        carId: initialNotification.data.carId,
        inspectionId: initialNotification.data.inspectionId,
      });
      setInitialNotification(null); // clear so it doesn’t trigger again
    }
  }}
>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={
          !firebaseUser
            ? "PhoneLogin"
            : user?.userType === "inspector"
            ? "InspectionMain"
            : !user?.firstName
            ? "PersonalDetails"
            : "MainApp"
        }
      >
     {!firebaseUser ? (
      <>
        <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        <Stack.Screen name="InspectionLogin" component={InspectionLoginScreen} />
        <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      </>
    ) : user?.userType === "inspector" ? (
      // Inspector Flow
      <>
        <Stack.Screen name="InspectionMain" component={InspectionScreenMain} />
        <Stack.Screen name="Inspection" component={InspectionScreen} />
        <Stack.Screen name="CarDetailsInspection" component={CarDetailsInspection} />
        <Stack.Screen name="ExteriorTyresInspection" component={ExteriorTyresInspection} />
        <Stack.Screen name="ElectricalInteriorInspection" component={ElectricalInteriorInspection} />
        <Stack.Screen name="EngineTransmissionInspection" component={EngineTransmissionInspection} />
        <Stack.Screen name="SteeringSuspensionBrakesInspection" component={SteeringSuspensionBrakesInspection} />
        <Stack.Screen name="AirConditioningInspection" component={AirConditioningInspection} />
        <Stack.Screen name="ComponentIssueScreen" component={ComponentIssueScreen} />
        <Stack.Screen name="ImagePreview" component={ImagePreview} />
        <Stack.Screen name="Review" component={ReviewScreen} />
      </>
    ) : (
      // Normal User Flow
      <>
        <Stack.Screen name="MainApp" component={MainAppNavigator} />
        <Stack.Screen name="CarDetails" component={CarDetailsScreen} />
        <Stack.Screen name="ContactUs" component={ContactUsScreen} />
        <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
        <Stack.Screen name="ImagePreview" component={ImagePreview} />

      </>
    )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
