import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./src/redux/store";
import RootNavigator from "./src/navigation/RootNavigator";
import { SafeAreaView } from "react-native-safe-area-context";
import PushNotification from "react-native-push-notification";
import { navigate, navigationRef } from "./src/utils/navigationService";
export default function App() {


PushNotification.configure({
  onNotification: function (notification) {
    console.log("NOTIFICATION CLICKED:", notification);

    if (notification.userInteraction && notification?.data?.screen === "CardetailsScreen") {
      if (navigationRef.isReady()) {
        navigate("CarDetails", {
          carId: notification.data.carId,
          inspectionId: notification.data.inspectionId,
        });
      }
    }
  },
  requestPermissions: true,
});
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaView style={{flex:1}} edges={['top','bottom']}>

        <RootNavigator />
        </SafeAreaView>

      </PersistGate>
    </Provider>
  );
}
