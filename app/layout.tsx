import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevOps IDP & Control Center",
  description: "Private Internal Developer Portal, Supabase Multi-Account Monitor and Zero-Knowledge Vault",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#09090b] text-[#f4f4f5] antialiased selection:bg-zinc-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
