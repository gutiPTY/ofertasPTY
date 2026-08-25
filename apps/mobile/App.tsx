import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { SessionContext } from "./context/SessionContext";
import type { RootStackParamList } from "./types/navigation";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import PublicarScreen from "./screens/PublicarScreen";
import MisOfertasScreen from "./screens/MisOfertasScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      {session ? (
        <SessionContext.Provider value={session}>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
              <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Encuentra Ofertas PTY" }} />
              <Stack.Screen name="Publicar" component={PublicarScreen} options={{ title: "Publicar oferta" }} />
              <Stack.Screen
                name="MisOfertas"
                component={MisOfertasScreen}
                options={{ title: "Mis ofertas" }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SessionContext.Provider>
      ) : (
        <AuthScreen />
      )}
      <StatusBar style="auto" />
    </>
  );
}
