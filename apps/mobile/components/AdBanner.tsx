import { View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

export default function AdBanner({ unitId }: { unitId: string }) {
  return (
    <View style={{ alignItems: "center", marginVertical: 8 }}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}
