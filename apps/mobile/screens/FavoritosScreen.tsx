import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useOptionalSession } from "../context/SessionContext";
import type { RootStackParamList } from "../types/navigation";
import { Card, PriceTag } from "../components/ui";
import { colors, spacing, textStyles } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Favoritos">;

interface FavoritoConOferta {
  id: string;
  oferta: {
    id: string;
    slug: string;
    titulo: string;
    imagenUrl: string;
    provincia: string;
    precioOferta: string | null;
    categoria: { nombre: string };
  };
}

export default function FavoritosScreen({ navigation }: Props) {
  const session = useOptionalSession();
  const [favoritos, setFavoritos] = useState<FavoritoConOferta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) navigation.replace("Auth");
  }, [session, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let active = true;
      setLoading(true);
      fetch(`${process.env.EXPO_PUBLIC_API_URL}/favoritos/mine`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (active) setFavoritos(data.favoritos ?? []);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [session]),
  );

  if (!session || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ember} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.background}
      contentContainerStyle={styles.list}
      data={favoritos}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ gap: spacing.sm }}
      ListEmptyComponent={<Text style={styles.empty}>Todavía no guardaste ninguna oferta.</Text>}
      renderItem={({ item }) => (
        <Card style={styles.card} onPress={() => navigation.navigate("Detalle", { slug: item.oferta.slug })}>
          <Image source={{ uri: item.oferta.imagenUrl }} style={styles.cardImage} />
          <View style={styles.cardBody}>
            <Text style={styles.cardTitulo} numberOfLines={2}>
              {item.oferta.titulo}
            </Text>
            <PriceTag precioOferta={item.oferta.precioOferta} size="sm" />
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: colors.paper },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.paper },
  list: { padding: spacing.md, gap: spacing.sm },
  empty: { ...textStyles.bodyMuted, color: colors.muted, textAlign: "center", marginTop: spacing.xxl },
  card: { flex: 1, marginBottom: spacing.sm },
  cardImage: { width: "100%", height: 100, backgroundColor: colors.surface2 },
  cardBody: { padding: spacing.sm, gap: 2 },
  cardTitulo: { ...textStyles.cardTitle, color: colors.ink },
});
