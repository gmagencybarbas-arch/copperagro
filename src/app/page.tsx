import { CopperAgroLanding } from "@/modules/landing/copperagro-landing";
import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
});

export default function HomePage() {
  return (
    <div className={geist.className}>
      <CopperAgroLanding />
    </div>
  );
}
