import { useEffect, useState } from "react";
import InfiniteCanvas from "../components/InfiniteCanvas";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";

import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

import CanvasItem from "../components/CanvasItem";
import { CanvasItemData } from "../types/canvas";
import "./global.css";

const STORAGE_KEY = "@dots_canvas_items";

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);

  const [canvasItems, setCanvasItems] = useState<CanvasItemData[]>([]);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [editedTitle, setEditedTitle] = useState("");

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadCanvas();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    saveCanvas();
  }, [canvasItems, isLoaded]);

  const loadCanvas = async () => {
    try {
      const savedCanvas = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedCanvas) {
        const parsedItems: CanvasItemData[] = JSON.parse(savedCanvas);

        setCanvasItems(parsedItems);
      }
    } catch (error) {
      console.log("Error loading canvas:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveCanvas = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(canvasItems));
    } catch (error) {
      console.log("Error saving canvas:", error);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItemId(id);
  };

  const deselectGesture = Gesture.Tap().onEnd(() => {
    scheduleOnRN(setSelectedItemId, null);
  });

  const handleDeleteItem = (id: string) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this image and note?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              const itemToDelete = canvasItems.find((item) => item.id === id);

              if (itemToDelete?.imageUri) {
                const file = new File(itemToDelete.imageUri);

                if (file.exists) {
                  file.delete();
                }
              }

              setCanvasItems((items) => items.filter((item) => item.id !== id));

              setSelectedItemId(null);
            } catch (error) {
              console.log("Error deleting image:", error);
            }
          },
        },
      ],
    );
  };

  const handlePositionChange = (id: string, x: number, y: number) => {
    setCanvasItems((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              x,
              y,
            }
          : item,
      ),
    );
  };

  const handleSizeChange = (id: string, width: number, height: number) => {
    setCanvasItems((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              width,
              height,
            }
          : item,
      ),
    );
  };

  const handleEditItem = (id: string) => {
    const item = canvasItems.find((item) => item.id === id);

    if (!item) return;

    setEditingItemId(id);
    setEditedTitle(item.title);
  };

  const handleSaveEdit = () => {
    if (!editingItemId) return;

    const cleanTitle = editedTitle.trim();

    setCanvasItems((items) =>
      items.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              title: cleanTitle.length > 0 ? cleanTitle : "Untitled",
            }
          : item,
      ),
    );

    setEditingItemId(null);
    setEditedTitle("");
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditedTitle("");
  };

  const addImageToCanvas = async (imageUri: string) => {
    try {
      const offset = canvasItems.length * 20;

      const filename = `canvas-image-${Date.now()}.jpg`;

      const sourceFile = new File(imageUri);

      const destinationFile = new File(Paths.document, filename);

      sourceFile.copy(destinationFile);

      const newItem: CanvasItemData = {
        id: Date.now().toString(),
        title: "New Note",
        imageUri: destinationFile.uri,
        x: 2200 + offset,
        y: 2200 + offset,
        width: 160,
        height: 160,
      };

      setCanvasItems((items) => [...items, newItem]);
      setSelectedItemId(newItem.id);
      setEditingItemId(newItem.id);
      setEditedTitle("");
    } catch (error) {
      console.log("Error copying image:", error);
      Alert.alert("Error", "Unable to save image.");
    }
  };

  const handlePickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photos.",
        );

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      addImageToCanvas(result.assets[0].uri);
    } catch (error) {
      console.log("Error picking image:", error);

      Alert.alert("Error", "Unable to select image.");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow camera access.");

        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      addImageToCanvas(result.assets[0].uri);
    } catch (error) {
      console.log("Error taking photo:", error);

      Alert.alert("Error", "Unable to take photo.");
    }
  };

  // const handleClearCanvas = () => {
  //   Alert.alert("Clear Canvas", "Are you sure you want to delete everything?", [
  //     {
  //       text: "Cancel",
  //       style: "cancel",
  //     },
  //     {
  //       text: "Clear Everything",
  //       style: "destructive",
  //       onPress: async () => {
  //         try {
  //           setCanvasItems([]);
  //           setSelectedItemId(null);

  //           await AsyncStorage.removeItem(STORAGE_KEY);
  //         } catch (error) {
  //           console.log("Error clearing canvas:", error);
  //         }
  //       },
  //     },
  //   ]);
  // };

  if (showWelcome) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7F7F5]">
        <View className="flex-1 items-center justify-center">
          <Image
            source={require("../assets/images/icon.png")}
            className="h-64 w-64"
            resizeMode="contain"
          />
          <View className="mt-6 items-center">
            <Text className="text-xl text-black">
              Add images, write notes &{" "}
            </Text>
            <Text className="text-xl text-black">
              {" "}
              Keep connecting the Dots...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F5]">
      <InfiniteCanvas>
        <GestureDetector gesture={deselectGesture}>
          <View
            style={{
              width: 5000,
              height: 5000,
            }}
            className="relative bg-transparent"
          >
            {canvasItems.map((item) => (
              <CanvasItem
                key={item.id}
                {...item}
                isSelected={selectedItemId === item.id}
                onSelect={handleSelectItem}
                onDelete={handleDeleteItem}
                onEdit={handleEditItem}
                onPositionChange={handlePositionChange}
                onSizeChange={handleSizeChange}
              />
            ))}
          </View>
        </GestureDetector>
      </InfiniteCanvas>

      {/* {canvasItems.length > 0 && (
        <Pressable
          onPress={handleClearCanvas}
          className="absolute bottom-8 left-6 rounded-full border border-red-300 bg-white px-5 py-3"
        >
          <Text className="font-medium text-red-500">Clear</Text>
        </Pressable>
      )} */}

      <Pressable
        onPress={() => {
          Alert.alert("Add Image", "Choose how you want to add an image", [
            {
              text: "Take Photo",
              onPress: handleTakePhoto,
            },
            {
              text: "Choose from Gallery",
              onPress: handlePickImage,
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]);
        }}
        className="absolute bottom-8 right-6 h-16 w-16 items-center justify-center rounded-full border border-blue-300 bg-white"
      >
        <Text className="text-4xl font-light text-blue-600">+</Text>
      </Pressable>

      <Modal
        visible={editingItemId !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancelEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 items-center justify-center bg-black/40 px-6"
        >
          <View className="w-full rounded-2xl bg-white p-5">
            <Text className="mb-4 text-xl font-semibold text-black">
              Edit Note
            </Text>

            <TextInput
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Write a note..."
              placeholderTextColor="#9CA3AF"
              autoFocus
              multiline
              textAlignVertical="top"
              className="min-h-[120px] rounded-xl border border-gray-300 p-4 text-base text-black"
            />

            <View className="mt-5 flex-row justify-end gap-3">
              <Pressable
                onPress={handleCancelEdit}
                className="rounded-xl bg-gray-200 px-5 py-3"
              >
                <Text className="font-medium text-gray-700">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveEdit}
                className="rounded-xl bg-blue-600 px-5 py-3"
              >
                <Text className="font-medium text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
