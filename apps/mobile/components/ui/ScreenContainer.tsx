import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { ScrollView, StyleSheet, View } from "react-native";
import { colors, spacing } from "../../theme";

export default function ScreenContainer({
  children,
  scroll,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  if (scroll) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, contentStyle]}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.container, styles.content, contentStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
});
