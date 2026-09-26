import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme, type Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import { Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import * as SplashScreen from "expo-splash-screen";
import mobileAds from "react-native-google-mobile-ads";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { SessionContext } from "./context/SessionContext";
import type { RootStackParamList } from "./types/navigation";
import { colors, fontFamily } from "./theme";
import FeedScreen from "./screens/FeedScreen";
import DetalleOfertaScreen from "./screens/DetalleOfertaScreen";
import AuthScreen from "./screens/AuthScreen";
import CuentaScreen from "./screens/CuentaScreen";
import PublicarScreen from "./screens/PublicarScreen";
import MisOfertasScreen from "./screens/MisOfertasScreen";
import FavoritosScreen from "./screens/FavoritosScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

const emberNavTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.ember,
    background: colors.paper,
    card: colors.surface,
    text: colors.ink,
    border: colors.line,
    notification: colors.ember,
  },
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontsLoaded] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    mobileAds().initialize();
  }, []);

  useEffect(() => {
    if (!loading && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading, fontsLoaded]);

  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.paper }}>
        <ActivityIndicator color={colors.ember} />
      </View>
    );
  }

  return (
    <SessionContext.Provider value={session}>
      <NavigationContainer theme={emberNavTheme}>
        <Stack.Navigator
          initialRouteName="Feed"
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTitleStyle: { fontFamily: fontFamily.displaySemibold, fontSize: 18, color: colors.ink },
            headerTintColor: colors.ember,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.paper },
          }}
        >
          <Stack.Screen name="Feed" component={FeedScreen} options={{ title: "Encuentra Ofertas PTY" }} />
          <Stack.Screen
            name="Detalle"
            component={DetalleOfertaScreen}
            options={{ title: "Detalle de la oferta" }}
          />
          <Stack.Screen name="Auth" component={AuthScreen} options={{ title: "Ingresar" }} />
          <Stack.Screen name="Cuenta" component={CuentaScreen} options={{ title: "Mi cuenta" }} />
          <Stack.Screen name="Publicar" component={PublicarScreen} options={{ title: "Publicar oferta" }} />
          <Stack.Screen name="MisOfertas" component={MisOfertasScreen} options={{ title: "Mis ofertas" }} />
          <Stack.Screen name="Favoritos" component={FavoritosScreen} options={{ title: "Favoritos" }} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SessionContext.Provider>
  );
}
