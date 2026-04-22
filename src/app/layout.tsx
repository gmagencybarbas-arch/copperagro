import { ThemeProvider } from "@/components/providers/theme-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "CopperAgro · Agricultural Intelligence Platform",
    template: "%s · CopperAgro",
  },
  description:
    "Transforme dados de venda em decisões estratégicas — inteligência agrícola para produtores e cooperativas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} bg-[#f7f7f7] font-sans text-gray-900 antialiased dark:bg-transparent dark:text-cyan-50`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
