import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Contexts/Providers";

export const metadata: Metadata = {
  title: "Kurio — NFT Marketplace",
  description: "Colecione arte digital exclusiva.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="pt-BR"><body><Providers>{children}</Providers></body></html>;
}
