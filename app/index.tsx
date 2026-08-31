import { Text, View } from "react-native";
import "./global.css";

export default function Index() {
  return (
    <View className="bg-[#090909] flex-1">
      <Text className="text-2xl">
        Dot
        <Text className="text-3xl">.</Text>
      </Text>
    </View>
  );
}