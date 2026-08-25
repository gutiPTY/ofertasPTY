import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CrearOfertaInputSchema, PROVINCIAS_PANAMA } from "@ofertaspty/shared-types";
import { supabase } from "../lib/supabase";
import { useSession } from "../context/SessionContext";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Publicar">;

interface Categoria {
  id: string;
  nombre: string;
}

export default function PublicarScreen({ navigation }: Props) {
  const session = useSession();

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
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imagen ? (
          <Image source={{ uri: imagen.uri }} style={styles.imagePreview} />
        ) : (
          <Text>Elegir foto</Text>
        )}
      </TouchableOpacity>

      <TextInput style={styles.input} placeholder="Título" value={titulo} onChangeText={setTitulo} />
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Descripción"
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flex1]}
          placeholder="Precio original (opcional)"
          value={precioOriginal}
          onChangeText={setPrecioOriginal}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, styles.flex1]}
          placeholder="Precio oferta (opcional)"
          value={precioOferta}
          onChangeText={setPrecioOferta}
          keyboardType="decimal-pad"
        />
      </View>

      <Text style={styles.label}>Provincia</Text>
      <View style={styles.chips}>
        {PROVINCIAS_PANAMA.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, provincia === p && styles.chipSelected]}
            onPress={() => setProvincia(p)}
          >
            <Text style={provincia === p ? styles.chipTextSelected : styles.chipText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Categoría</Text>
      <View style={styles.chips}>
        {categorias.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, categoriaId === c.id && styles.chipSelected]}
            onPress={() => setCategoriaId(c.id)}
          >
            <Text style={categoriaId === c.id ? styles.chipTextSelected : styles.chipText}>{c.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Vigencia desde (AAAA-MM-DD)"
        value={fechaInicio}
        onChangeText={setFechaInicio}
      />
      <TextInput
        style={styles.input}
        placeholder="Vigencia hasta (AAAA-MM-DD)"
        value={fechaVencimiento}
        onChangeText={setFechaVencimiento}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Publicar</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 10 },
  imagePicker: {
    height: 160,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imagePreview: { width: "100%", height: "100%" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10 },
  flex1: { flex: 1 },
  label: { fontWeight: "600", marginTop: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#ccc", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipSelected: { backgroundColor: "#000", borderColor: "#000" },
  chipText: { fontSize: 13 },
  chipTextSelected: { fontSize: 13, color: "#fff" },
  submitButton: { backgroundColor: "#000", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 12 },
  submitButtonText: { color: "#fff", fontWeight: "600" },
});
