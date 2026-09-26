import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, radii, spacing } from "../../theme";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  style,
}: Props) {
  const isPrimary = variant === "primary";
  const textColor = isPrimary ? colors.emberInk : colors.ink;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={16} color={textColor} style={styles.icon} />}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
  },
  primary: {
    backgroundColor: colors.ember,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.line,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: spacing.xs,
  },
  label: {
    fontFamily: fontFamily.sansBold,
    fontSize: 14,
  },
});
