import { useCallback, useEffect, useRef, useState } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";

import CanvasItem from "../components/CanvasItem";
import {
  ConnectionLinesLayer,
  ConnectionBadgesLayer,
} from "../components/ConnectionLayer";
import {
  DEFAULT_BACKGROUND_ID,
  getBackgroundSource,
} from "../constants/backgrounds";
import {
  loadBackgroundId,
  loadConnections,
  saveConnections,
} from "../lib/storage";
import {
  BackgroundId,
  CanvasItemData,
  Connection,
  ItemLayout,
} from "../types/canvas";
import "./global.css";

const STORAGE_KEY = "@dots_canvas_items";

export default function Home() {
  const router = useRouter();

  const [showWelcome, setShowWelcome] = useState(true);

  const [canvasItems, setCanvasItems] = useState<CanvasItemData[]>([]);

  const [connections, setConnections] = useState<Connection[]>([]);

  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);

  const [backgroundId, setBackgroundId] = useState<BackgroundId>(
    DEFAULT_BACKGROUND_ID,
  );

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [editedTitle, setEditedTitle] = useState("");

  const [isLoaded, setIsLoaded] = useState(false);

  // Live card geometry (shared values) used by the connection layer.
  const layoutRegistry = useRef(new Map<string, ItemLayout>());
  const [layoutVersion, setLayoutVersion] = useState(0);

  const registerLayout = useCallback((id: string, layout: ItemLayout) => {
    layoutRegistry.current.set(id, layout);
    setLayoutVersion((v) => v + 1);
  }, []);

  const unregisterLayout = useCallback((id: string) => {
    if (layoutRegistry.current.delete(id)) {
      setLayoutVersion((v) => v + 1);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadCanvas();
  }, []);

  // Re-read the background whenever we come back from Settings.
  // The canvas itself stays mounted, so nothing resets.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadBackgroundId().then((id) => {
        if (active) setBackgroundId(id);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    if (!isLoaded) return;

    saveCanvas();
  }, [canvasItems, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    saveConnections(connections);
  }, [connections, isLoaded]);

  const loadCanvas = async () => {
    try {
      const savedCanvas = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedCanvas) {
        const parsedItems = JSON.parse(savedCanvas);

        if (Array.isArray(parsedItems)) {
          setCanvasItems(parsedItems);

          // Older (V2) installs have no connections key -> [].
          const validIds = new Set<string>(
            parsedItems.map((item: CanvasItemData) => item.id),
          );
          setConnections(await loadConnections(validIds));
        } else {
          console.log("Invalid canvas data in storage:", parsedItems);
          setCanvasItems([]);
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.log("Error loading canvas:", error);
      setCanvasItems([]);
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

  /* ---------------------------- Connections --------------------------- */

  const handleConnectStart = (id: string) => {
    setSelectedItemId(id);
    setConnectingFromId(id);
  };

  const handleCancelConnect = () => {
    setConnectingFromId(null);
  };

  const handleConnectTarget = (id: string) => {
    const fromId = connectingFromId;

    if (!fromId || fromId === id) return;

    setConnections((prev) => {
      const exists = prev.some(
        (c) =>
          (c.fromId === fromId && c.toId === id) ||
          (c.fromId === id && c.toId === fromId),
      );

      if (exists) return prev;

      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          fromId,
          toId: id,
        },
      ];
    });

    setConnectingFromId(null);
    setSelectedItemId(id);
  };

  const handleRemoveConnection = (connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
  };

  const handleCanvasTap = () => {
    setSelectedItemId(null);
    setConnectingFromId(null);
  };

  const deselectGesture = Gesture.Tap().onEnd(() => {
    scheduleOnRN(handleCanvasTap);
  });

  /* ------------------------------- Items ------------------------------ */

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

              // Remove every connection attached to the deleted image.
              setConnections((prev) =>
                prev.filter((c) => c.fromId !== id && c.toId !== id),
              );

              setConnectingFromId((current) =>
                current === id ? null : current,
              );

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

  const isConnecting = connectingFromId !== null;

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F5]">
      <InfiniteCanvas background={getBackgroundSource(backgroundId)}>
        <GestureDetector gesture={deselectGesture}>
          <View
            style={{
              width: 5000,
              height: 5000,
            }}
            className="relative bg-transparent"
          >
            {/* 1. Connection lines: behind the cards */}
            <ConnectionLinesLayer
              connections={connections}
              layouts={layoutRegistry.current}
              version={layoutVersion}
            />

            {/* 2. Cards */}
            {(Array.isArray(canvasItems) ? canvasItems : []).map((item) => (
              <CanvasItem
                key={item.id}
                {...item}
                isSelected={selectedItemId === item.id}
                isConnecting={isConnecting}
                isConnectSource={connectingFromId === item.id}
                onSelect={handleSelectItem}
                onDelete={handleDeleteItem}
                onEdit={handleEditItem}
                onConnectStart={handleConnectStart}
                onConnectTarget={handleConnectTarget}
                onPositionChange={handlePositionChange}
                onSizeChange={handleSizeChange}
                registerLayout={registerLayout}
                unregisterLayout={unregisterLayout}
              />
            ))}

            {/* 3. Remove badges for the selected card's connections */}
            <ConnectionBadgesLayer
              connections={connections}
              layouts={layoutRegistry.current}
              version={layoutVersion}
              selectedItemId={isConnecting ? null : selectedItemId}
              onRemove={handleRemoveConnection}
            />
          </View>
        </GestureDetector>
      </InfiniteCanvas>

      {isConnecting ? (
        <View className="absolute left-6 right-20 top-4 flex-row items-center rounded-full border border-red-200 bg-white px-4 py-2">
          <Text className="flex-1 text-sm text-gray-800">
            Tap another image to connect
          </Text>
          <Pressable
            onPress={handleCancelConnect}
            className="ml-3 rounded-full bg-gray-100 px-3 py-1.5"
          >
            <Text className="text-sm font-medium text-gray-700">Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={() => router.push("/settings" as any)}
        className="absolute right-6 top-4 h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white"
      >
        <Feather name="settings" size={20} color="#374151" />
      </Pressable>

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
