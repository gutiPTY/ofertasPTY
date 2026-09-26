// RN ignora `fontWeight` una vez que se carga una fuente custom por peso
// específico — hay que usar el nombre exacto de familia que exporta
// @expo-google-fonts (ver App.tsx: useFonts). Equivalente a font-display
// (Fredoka) / font-sans (Manrope) en apps/web/tailwind.config.ts.
export const fontFamily = {
  displayMedium: "Fredoka_500Medium",
  displaySemibold: "Fredoka_600SemiBold",
  displayBold: "Fredoka_700Bold",
  sansRegular: "Manrope_400Regular",
  sansMedium: "Manrope_500Medium",
  sansSemibold: "Manrope_600SemiBold",
  sansBold: "Manrope_700Bold",
  sansExtrabold: "Manrope_800ExtraBold",
} as const;

export const textStyles = {
  sectionHeading: { fontFamily: fontFamily.displaySemibold, fontSize: 22 },
  cardTitle: { fontFamily: fontFamily.displaySemibold, fontSize: 14 },
  price: { fontFamily: fontFamily.displaySemibold, fontSize: 16 },
  body: { fontFamily: fontFamily.sansRegular, fontSize: 14 },
  bodyMuted: { fontFamily: fontFamily.sansRegular, fontSize: 13 },
  microLabel: {
    fontFamily: fontFamily.sansBold,
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
  },
} as const;
