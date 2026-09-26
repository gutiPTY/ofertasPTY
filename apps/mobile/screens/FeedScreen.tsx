import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PROVINCIAS_PANAMA } from "@ofertaspty/shared-types";
import type { RootStackParamList } from "../types/navigation";
import AdBanner from "../components/AdBanner";
import { AD_UNIT_FEED_BANNER } from "../lib/ads";
import { Button, Card, Chip, CategoryPill, PriceTag } from "../components/ui";
import { colors, fontFamily, radii, spacing, textStyles } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Feed">;

interface Categoria {
  id: string;
  nombre: string;
}

interface OfertaFeed {
  id: string;
  slug: string;
  titulo: string;
  imagenUrl: string;
  provincia: string;
  precioOferta: string | null;
  precioOriginal: string | null;
  categoria: { nombre: string };
}

export default function FeedScreen({ navigation }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [provincia, setProvincia] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [ofertas, setOfertas] = useState<OfertaFeed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL}/categorias`)
      .then((res) => res.json())
      .then((data) => setCategorias(data.categorias ?? []))
      .catch(() => setCategorias([]));
  }, []);

  const fetchFeed = useCallback(() => {
    const params = new URLSearchParams();
    if (categoriaId) params.set("categoriaId", categoriaId);
    if (provincia) params.set("provincia", provincia);
    if (q) params.set("q", q);

    setLoading(true);
    fetch(`${process.env.EXPO_PUBLIC_API_URL}/ofertas?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setOfertas(data.ofertas ?? []))
      .finally(() => setLoading(false));
  }, [categoriaId, provincia, q]);

  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [fetchFeed]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Button
          label="Cuenta"
          variant="secondary"
          icon="person-circle-outline"
          onPress={() => navigation.navigate("Cuenta")}
        />
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={16} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ofertas..."
          placeholderTextColor={colors.muted}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={fetchFeed}
          returnKeyType="search"
        />
      </View>

      <View style={styles.chips}>
        <Chip label="Todas las provincias" selected={!provincia} onPress={() => setProvincia(null)} />
        {PROVINCIAS_PANAMA.map((p) => (
          <Chip
            key={p}
            label={p}
            selected={provincia === p}
            onPress={() => setProvincia(provincia === p ? null : p)}
          />
        ))}
      </View>
      <View style={styles.chips}>
        <Chip label="Todas las categorías" selected={!categoriaId} onPress={() => setCategoriaId(null)} />
        {categorias.map((c) => (
          <Chip
            key={c.id}
            label={c.nombre}
            selected={categoriaId === c.id}
            onPress={() => setCategoriaId(categoriaId === c.id ? null : c.id)}
          />
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.ember} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={ofertas}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.sm }}
          ListEmptyComponent={<Text style={styles.empty}>No hay ofertas que coincidan.</Text>}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => navigation.navigate("Detalle", { slug: item.slug })}>
              <View>
                <Image source={{ uri: item.imagenUrl }} style={styles.cardImage} />
                <CategoryPill nombre={item.categoria.nombre} style={styles.categoryBadge} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardProvincia}>{item.provincia}</Text>
                <Text style={styles.cardTitulo} numberOfLines={2}>
                  {item.titulo}
                </Text>
                <PriceTag precioOferta={item.precioOferta} precioOriginal={item.precioOriginal} size="sm" />
              </View>
            </Card>
          )}
        />
      )}

      <AdBanner unitId={AD_UNIT_FEED_BANNER} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: spacing.md, gap: spacing.sm },
  headerRow: { flexDirection: "row", justifyContent: "flex-end" },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.sansRegular,
    fontSize: 14,
    color: colors.ink,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  list: { gap: spacing.sm, paddingTop: spacing.xs, paddingBottom: spacing.xxl },
  empty: { ...textStyles.bodyMuted, color: colors.muted, textAlign: "center", marginTop: spacing.xxl },
  card: { flex: 1, marginBottom: spacing.sm },
  cardImage: { width: "100%", height: 100, backgroundColor: colors.surface2 },
  categoryBadge: { position: "absolute", left: spacing.xs, top: spacing.xs },
  cardBody: { padding: spacing.sm, gap: 2 },
  cardProvincia: { ...textStyles.bodyMuted, color: colors.muted, fontSize: 11 },
  cardTitulo: { ...textStyles.cardTitle, color: colors.ink },
});
