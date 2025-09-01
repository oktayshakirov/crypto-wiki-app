import React, { useState, useEffect } from "react";
import { Image, ImageProps, View, StyleSheet } from "react-native";
import { ImageCache } from "@/utils/imageCache";
import { Colors } from "@/constants/Colors";
import MaterialIcons from "@expo/vector-icons/Fontisto";

interface OfflineImageProps extends Omit<ImageProps, "source"> {
  source: { uri: string } | undefined;
  fallbackIcon?: keyof typeof MaterialIcons.glyphMap;
  fallbackIconSize?: number;
}

export default function OfflineImage({
  source,
  style,
  fallbackIcon = "photograph",
  fallbackIconSize = 24,
  ...props
}: OfflineImageProps) {
  const [imageSource, setImageSource] = useState<{ uri: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    loadImage();
  }, [source?.uri]);

  const loadImage = async () => {
    if (!source?.uri) {
      setImageSource(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);

      const cachedSource = await ImageCache.getImageSource(source.uri);
      if (cachedSource && typeof cachedSource === "object") {
        setImageSource(cachedSource);
      } else {
        setImageSource(source);
      }
    } catch {
      setHasError(true);
      setImageSource(source);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = () => {
    setHasError(true);
  };

  if (isLoading) {
    return (
      <View style={[style, styles.placeholderContainer]}>
        <MaterialIcons
          name="photograph"
          size={fallbackIconSize}
          color={Colors.icon}
        />
      </View>
    );
  }

  if (hasError || !imageSource) {
    return (
      <View style={[style, styles.placeholderContainer]}>
        <MaterialIcons
          name={fallbackIcon}
          size={fallbackIconSize}
          color={Colors.icon}
        />
      </View>
    );
  }

  return (
    <Image
      {...props}
      style={style}
      source={imageSource}
      onError={handleImageError}
    />
  );
}

const styles = StyleSheet.create({
  placeholderContainer: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
});
