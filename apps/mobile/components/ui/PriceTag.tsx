import { StyleSheet, Text, View } from "react-native";
import { colors, fontFamily } from "../../theme";

export default function PriceTag({
  precioOferta,
  precioOriginal,
  size = "md",
}: {
  precioOferta?: string | null;
  precioOriginal?: string | null;
  size?: "sm" | "md";
}) {
  if (!precioOferta) return null;

  return (
    <View style={styles.row}>
      <Text style={[styles.price, size === "sm" && styles.priceSm]}>${precioOferta}</Text>
      {precioOriginal && <Text style={styles.original}>${precioOriginal}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  price: {
    fontFamily: fontFamily.displaySemibold,
    fontSize: 16,
    color: colors.ember,
  },
  priceSm: {
    fontSize: 13,
  },
  original: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 12,
    color: colors.muted,
    textDecorationLine: "line-through",
  },
});
