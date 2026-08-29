import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Proxy fino: obtiene una URL firmada de corta duración desde la API y
// redirige. El documento nunca pasa por un bucket público ni por una URL
// que el navegador pueda guardar/compartir de forma persistente.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/comercios/${params.id}/documento`,
    { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" },
  );

  if (!res.ok) {
    return NextResponse.json({ error: "no_se_pudo_obtener_documento" }, { status: res.status });
  }

  const { url } = (await res.json()) as { url: string };
  return NextResponse.redirect(url);
}
