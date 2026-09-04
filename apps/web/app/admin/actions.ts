"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function accessToken() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No autenticado");
  return session.access_token;
}

export async function aprobarOferta(id: string) {
  const token = await accessToken();
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ofertas/${id}/aprobar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  revalidatePath("/admin");
}

export async function rechazarOferta(id: string, formData: FormData) {
  const token = await accessToken();
  const motivo = formData.get("motivo");
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ofertas/${id}/rechazar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ motivo: typeof motivo === "string" && motivo ? motivo : undefined }),
  });
  revalidatePath("/admin");
}

export async function suspenderUsuario(id: string) {
  const token = await accessToken();
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/usuarios/${id}/suspender`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  revalidatePath("/admin");
}

export async function verificarComercio(id: string) {
  const token = await accessToken();
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/comercios/${id}/verificar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  revalidatePath("/admin");
}

export async function rechazarComercio(id: string, formData: FormData) {
  const token = await accessToken();
  const motivo = formData.get("motivo");
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/comercios/${id}/rechazar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ motivo: typeof motivo === "string" ? motivo : "" }),
  });
  revalidatePath("/admin");
}

export async function editarOferta(id: string, formData: FormData) {
  const token = await accessToken();

  const raw: Record<string, unknown> = {};
  for (const campo of [
    "titulo",
    "descripcion",
    "imagenUrl",
    "precioOriginal",
    "precioOferta",
    "provincia",
    "distrito",
    "direccion",
    "linkExterno",
    "fechaInicio",
    "fechaVencimiento",
    "categoriaId",
    "diaSemana",
  ]) {
    const valor = formData.get(campo);
    if (typeof valor === "string" && valor !== "") raw[campo] = valor;
  }

  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ofertas/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(raw),
  });
  revalidatePath("/admin");
}

export async function togglePlanPago(id: string) {
  const token = await accessToken();
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/comercios/${id}/plan-pago`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  revalidatePath("/admin");
}
