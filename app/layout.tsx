import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "Steffen Vorholt – Comedy-Universum",
  description: "Drei Shows. Ein Host. Unendlich viele Lacher.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className={`${inter.variable} ${grotesk.variable}`}>
        <div className="page">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
