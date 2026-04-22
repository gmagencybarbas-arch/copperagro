import { redirect } from "next/navigation";

/** Alias comum `/home` → landing na raiz */
export default function HomeAliasPage() {
  redirect("/");
}
