import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors, fontFamily, radii, spacing } from "../../theme";

export default function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.chip, selected ? styles.selected : styles.unselected]}
    >
      <Text style={[styles.label, { color: selected ? colors.paper : colors.ink }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  selected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  unselected: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
  },
  label: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 12,
  },
});
