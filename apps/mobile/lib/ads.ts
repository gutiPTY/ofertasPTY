import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

// IDs reales de AdMob (no son secretos, van embebidos en el bundle igual que
// el publisher id de AdSense en la web). En desarrollo se usan los TestIds
// oficiales de Google para no arriesgar la cuenta con clicks/impresiones
// propias sobre anuncios reales.
const FEED_BANNER_PROD = Platform.select({
  ios: "ca-app-pub-5894931261942967/8760211823",
  android: "ca-app-pub-5894931261942967/4588645484",
})!;

const DETALLE_BANNER_PROD = Platform.select({
  ios: "ca-app-pub-5894931261942967/8034287668",
  android: "ca-app-pub-5894931261942967/4525066301",
})!;

export const AD_UNIT_FEED_BANNER = __DEV__ ? TestIds.BANNER : FEED_BANNER_PROD;
export const AD_UNIT_DETALLE_BANNER = __DEV__ ? TestIds.BANNER : DETALLE_BANNER_PROD;
