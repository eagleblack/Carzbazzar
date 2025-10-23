// store.js
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

import userReducer from "./userSlice";
import inspectionReducer from "./inspectionSlice";
import inspectionProgressReducer from "./inspectionProgressSlice";

// 🔹 Redux Persist Config
const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["user", "inspections", "inspectionProgress"], // persist only these slices
};

// 🔹 Root Reducer with RESET handling
const appReducer = combineReducers({
  user: userReducer,
  inspections: inspectionReducer,
  inspectionProgress: inspectionProgressReducer,
});

const rootReducer = (state, action) => {
  if (action.type === "RESET") {
    // wipe everything in Redux & AsyncStorage
    state = undefined;
  }
  return appReducer(state, action);
};

// 🔹 Persisted Reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 🔹 Store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// 🔹 Persistor
export const persistor = persistStore(store);
