import { useEffect, useState } from "react";
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CrearOfertaInputSchema, PROVINCIAS_PANAMA } from "@ofertaspty/shared-types";
import { supabase } from "../lib/supabase";
import { useOptionalSession } from "../context/SessionContext";
import type { RootStackParamList } from "../types/navigation";
import { Button, Chip, ScreenContainer } from "../components/ui";
import { colors, radii, spacing, textStyles } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Publicar">;

interface Categoria {
  id: string;
  nombre: string;
}

export default function PublicarScreen({ navigation }: Props) {
  const session = useOptionalSession();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [provincia, setProvincia] = useState<string | null>(null);
  const [imagen, setImagen] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioOriginal, setPrecioOriginal] = useState("");
  const [precioOferta, setPrecioOferta] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL}/categorias`)
      .then((res) => res.json())
      .then((data) => setCategorias(data.categorias ?? []))
      .catch(() => setCategorias([]));
  }, []);

  useEffect(() => {
    if (!session) navigation.replace("Auth");
  }, [session, navigation]);

  if (!session) return null;

  async function pickImage() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tus fotos para subir la imagen.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImagen(result.assets[0]);
    }
  }

  async function handleSubmit() {
    if (!session) return;
    if (!imagen) {
      Alert.alert("Falta la imagen", "Elegí una foto para la oferta.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(imagen.uri);
      const blob = await response.blob();
      const path = `${session.user.id}/${Date.now()}-${imagen.fileName ?? "foto.jpg"}`;
      const { error: uploadError } = await supabase.storage
        .from("ofertas")
        .upload(path, blob, { contentType: imagen.mimeType ?? "image/jpeg" });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("ofertas").getPublicUrl(path);

      const parsed = CrearOfertaInputSchema.safeParse({
        titulo,
        descripcion,
        imagenUrl: publicUrl,
        precioOriginal: precioOriginal || undefined,
        precioOferta: precioOferta || undefined,
        provincia,
        fechaInicio,
        fechaVencimiento,
        categoriaId,
      });
      if (!parsed.success) {
        Alert.alert("Datos inválidos", parsed.error.issues[0]?.message ?? "Revisá el formulario");
        return;
      }

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/ofertas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        Alert.alert(
          "No se pudo publicar",
          body.error === "limite_ofertas_pendientes"
            ? "Ya tenés demasiadas ofertas pendientes de moderación."
            : "Intentá de nuevo en un momento.",
        );
        return;
      }

      navigation.navigate("MisOfertas");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imagen ? (
          <Image source={{ uri: imagen.uri }} style={styles.imagePreview} />
        ) : (
          <View style={styles.imagePickerEmpty}>
            <Ionicons name="camera-outline" size={28} color={colors.muted} />
            <Text style={styles.imagePickerLabel}>Elegir foto</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Título"
        placeholderTextColor={colors.muted}
        value={titulo}
        onChangeText={setTitulo}
      />
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Descripción"
        placeholderTextColor={colors.muted}
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flex1]}
          placeholder="Precio original (opcional)"
          placeholderTextColor={colors.muted}
          value={precioOriginal}
          onChangeText={setPrecioOriginal}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, styles.flex1]}
          placeholder="Precio oferta (opcional)"
          placeholderTextColor={colors.muted}
          value={precioOferta}
          onChangeText={setPrecioOferta}
          keyboardType="decimal-pad"
        />
      </View>

      <Text style={styles.label}>Provincia</Text>
      <View style={styles.chips}>
        {PROVINCIAS_PANAMA.map((p) => (
          <Chip key={p} label={p} selected={provincia === p} onPress={() => setProvincia(p)} />
        ))}
      </View>

      <Text style={styles.label}>Categoría</Text>
      <View style={styles.chips}>
        {categorias.map((c) => (
          <Chip
            key={c.id}
            label={c.nombre}
            selected={categoriaId === c.id}
            onPress={() => setCategoriaId(c.id)}
          />
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Vigencia desde (AAAA-MM-DD)"
        placeholderTextColor={colors.muted}
        value={fechaInicio}
        onChangeText={setFechaInicio}
      />
      <TextInput
        style={styles.input}
        placeholder="Vigencia hasta (AAAA-MM-DD)"
        placeholderTextColor={colors.muted}
        value={fechaVencimiento}
        onChangeText={setFechaVencimiento}
      />

      <Button label="Publicar" onPress={handleSubmit} loading={loading} style={styles.submitButton} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.sm },
  imagePicker: {
    height: 160,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imagePickerEmpty: { alignItems: "center", gap: spacing.xs },
  imagePickerLabel: { ...textStyles.bodyMuted, color: colors.muted },
  imagePreview: { width: "100%", height: "100%" },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.sm,
    padding: spacing.md,
    fontFamily: textStyles.body.fontFamily,
    fontSize: 14,
    color: colors.ink,
  },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: spacing.sm },
  flex1: { flex: 1 },
  label: { ...textStyles.microLabel, color: colors.muted, marginTop: spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  submitButton: { marginTop: spacing.sm },
});
