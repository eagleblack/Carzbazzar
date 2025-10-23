import React, { useState } from "react";
import { View, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";

export default function MediaPreview({ route, navigation }) {
  const { url, type } = route.params; // ✅ get type from params
  const [isPlaying, setIsPlaying] = useState(true);
   console.log(route.params)
  return (
    <View style={styles.container}>
      {/* 🔹 Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>

      {/* 🔹 Media */}
      {type === "video" ? (
        <Video
          source={{ uri: url }}
          style={styles.media}
          resizeMode="contain"
          useNativeControls
          shouldPlay={isPlaying}
        />
      ) : (
        <Image source={{ uri: url }} style={styles.media} resizeMode="contain" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 6,
    borderRadius: 20,
  },
  media: { flex: 1, width: "100%", height: "100%" },
});
