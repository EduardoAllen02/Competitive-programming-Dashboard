import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CompOS",
  description: "Sistema de Gestión de Competencias de Programación",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex h-screen overflow-hidden" style={{ backgroundColor: "#06060a", color: "#ffffff" }}>
        <Sidebar />
        <main
          className="flex-1 overflow-y-auto p-8 relative grid-bg orb-bg"
          style={{ backgroundColor: "#050810" }}
        >
          {children}
        </main>
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "#0f1620",
              border: "1px solid #1e3a5f",
              color: "#e2e8f0",
            },
          }}
        />
      </body>
    </html>
  );
}
