import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text } from "react-native";
import { supabase } from "../lib/supabase";
import { useOptionalSession } from "../context/SessionContext";
import type { RootStackParamList } from "../types/navigation";
import { Button, ScreenContainer } from "../components/ui";
import { colors, fontFamily, spacing, textStyles } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Cuenta">;

export default function CuentaScreen({ navigation }: Props) {
  const session = useOptionalSession();

  if (!session) {
    return (
      <ScreenContainer contentStyle={styles.content}>
        <Text style={styles.title}>Encuentra Ofertas PTY</Text>
        <Button label="Ingresar" onPress={() => navigation.navigate("Auth")} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={styles.content}>
      <Text style={styles.title}>Encuentra Ofertas PTY</Text>
      <Text style={styles.email}>
        Sesión iniciada como <Text style={styles.emailBold}>{session.user.email}</Text>
      </Text>

      <Button label="Publicar oferta" style={styles.button} onPress={() => navigation.navigate("Publicar")} />
      <Button
        label="Mis ofertas"
        variant="secondary"
        style={styles.button}
        onPress={() => navigation.navigate("MisOfertas")}
      />
      <Button
        label="Favoritos"
        variant="secondary"
        style={styles.button}
        onPress={() => navigation.navigate("Favoritos")}
      />
      <Button
        label="Cerrar sesión"
        variant="secondary"
        icon="log-out-outline"
        style={styles.button}
        onPress={() => supabase.auth.signOut()}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", alignItems: "center", gap: spacing.md, padding: spacing.xl },
  title: { ...textStyles.sectionHeading, color: colors.ink },
  email: { ...textStyles.body, color: colors.ink },
  emailBold: { fontFamily: fontFamily.sansSemibold },
  button: { minWidth: 200 },
});
