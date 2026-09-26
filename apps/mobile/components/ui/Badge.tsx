import { StyleSheet, Text } from "react-native";
import { colors, fontFamily, radii, spacing } from "../../theme";

type Tone = "success" | "warning" | "critical" | "muted";

const TONE_COLORS: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: colors.successBg, fg: colors.success },
  warning: { bg: colors.warningBg, fg: colors.warning },
  critical: { bg: colors.criticalBg, fg: colors.critical },
  muted: { bg: colors.surface2, fg: colors.muted },
};

export default function Badge({ label, tone = "muted" }: { label: string; tone?: Tone }) {
  const { bg, fg } = TONE_COLORS[tone];

  return (
    <Text style={[styles.badge, { backgroundColor: bg, color: fg }]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    fontFamily: fontFamily.sansBold,
    fontSize: 11,
    overflow: "hidden",
  },
});
