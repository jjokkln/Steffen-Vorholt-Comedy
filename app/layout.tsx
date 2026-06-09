import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Steffen Vorholt – Comedy-Universum",
  description: "Drei Shows. Ein Host. Unendlich viele Lacher.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>
        <div className="page">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
