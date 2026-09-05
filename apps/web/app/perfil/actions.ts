"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function guardarPreferencias(_prevState: { ok: boolean } | null, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No autenticado");

  const categoriaIds = formData.getAll("categoriaIds").map(String);
  const provincias = formData.getAll("provincias").map(String);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/preferencias/mine`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ categoriaIds, provincias }),
  });

  revalidatePath("/perfil");
  return { ok: res.ok };
}
