import { DEFAULT_SECTOR_ID } from "@/store/sector-store";
import { redirect } from "next/navigation";

export default function VendasPage() {
  redirect(`/setor/${DEFAULT_SECTOR_ID}`);
}
