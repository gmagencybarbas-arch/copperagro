import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ exists: false }, { status: 400 });
    }

    // Sem tabela profiles: consulta Auth Admin
    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (!error && data?.users?.length) {
        const exists = data.users.some((u) => (u.email ?? "").toLowerCase() === email);
        if (exists) return NextResponse.json({ exists: true });
      }
    } catch {
      // cai no fetch HTTP abaixo
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
    const secret = process.env.SUPABASE_SECRET_KEY?.trim() ?? "";
    if (url && secret) {
      const res = await fetch(
        `${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${secret}`,
            apikey: secret,
          },
        },
      );
      if (res.ok) {
        const json = (await res.json()) as { users?: { email?: string }[]; user?: { email?: string } };
        const users = json.users ?? (json.user ? [json.user] : []);
        const exists = users.some((u) => (u.email ?? "").toLowerCase() === email);
        return NextResponse.json({ exists });
      }
    }

    return NextResponse.json({ exists: false });
  } catch {
    return NextResponse.json({ exists: false }, { status: 200 });
  }
}
