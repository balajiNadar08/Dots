import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { BACKGROUNDS, DEFAULT_BACKGROUND_ID } from "../constants/backgrounds";
import { loadBackgroundId, saveBackgroundId } from "../lib/storage";
import type { BackgroundId } from "../types/canvas";
import "./global.css";

export default function Settings() {
  const router = useRouter();
  const [selected, setSelected] = useState<BackgroundId>(DEFAULT_BACKGROUND_ID);

  useEffect(() => {
    loadBackgroundId().then(setSelected);
  }, []);

  const choose = (id: BackgroundId) => {
    setSelected(id);
    saveBackgroundId(id);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F5]">
      <View className="flex-row items-center px-6 pb-4 pt-4">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white"
        >
          <Feather name="arrow-left" size={20} color="#374151" />
        </Pressable>
        <Text className="ml-4 text-2xl font-semibold text-black">Settings</Text>
      </View>

      <ScrollView contentContainerClassName="px-6 pb-10">
        <Text className="mb-3 mt-2 text-sm font-medium uppercase text-gray-500">
          Background Appearance
        </Text>

        {BACKGROUNDS.map((bg) => {
          const isActive = bg.id === selected;
          return (
            <Pressable key={bg.id} onPress={() => choose(bg.id)} className="mb-5">
              <View
                className={`h-40 overflow-hidden rounded-2xl bg-white ${
                  isActive ? "border-2 border-blue-500" : "border border-gray-200"
                }`}
              >
                <Image
                  source={bg.source}
                  className="h-full w-full"
                  resizeMode="cover"
                />
                {isActive && (
                  <View className="absolute right-3 top-3 h-7 w-7 items-center justify-center rounded-full bg-blue-500">
                    <Feather name="check" size={16} color="white" />
                  </View>
                )}
              </View>
              <Text
                className={`mt-2 text-base ${
                  isActive ? "font-semibold text-blue-600" : "text-gray-800"
                }`}
              >
                {bg.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}