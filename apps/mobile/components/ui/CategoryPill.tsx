import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text } from "react-native";
import { categoriaColor, fontFamily, radii, spacing } from "../../theme";

export default function CategoryPill({
  nombre,
  style,
}: {
  nombre: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { fg } = categoriaColor(nombre);

  return (
    <Text style={[styles.pill, { backgroundColor: fg }, style]} numberOfLines={1}>
      {nombre}
    </Text>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    color: "#fff",
    fontFamily: fontFamily.sansBold,
    fontSize: 11,
    overflow: "hidden",
  },
});
