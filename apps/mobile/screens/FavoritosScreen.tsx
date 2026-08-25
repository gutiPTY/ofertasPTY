import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useOptionalSession } from "../context/SessionContext";
import type { RootStackParamList } from "../types/navigation";

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
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={favoritos}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 10 }}
      ListEmptyComponent={<Text style={styles.empty}>Todavía no guardaste ninguna oferta.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Detalle", { slug: item.oferta.slug })}
        >
          <Image source={{ uri: item.oferta.imagenUrl }} style={styles.cardImage} />
          <Text style={styles.cardTitulo} numberOfLines={2}>
            {item.oferta.titulo}
          </Text>
          {item.oferta.precioOferta && <Text style={styles.cardPrecio}>${item.oferta.precioOferta}</Text>}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 12, gap: 10 },
  empty: { textAlign: "center", color: "#666", marginTop: 24 },
  card: { flex: 1, borderWidth: 1, borderColor: "#eee", borderRadius: 8, overflow: "hidden", marginBottom: 10 },
  cardImage: { width: "100%", height: 100 },
  cardTitulo: { fontSize: 13, fontWeight: "600", paddingHorizontal: 8, paddingTop: 4 },
  cardPrecio: { fontSize: 13, fontWeight: "700", paddingHorizontal: 8, paddingBottom: 8, paddingTop: 2 },
});
