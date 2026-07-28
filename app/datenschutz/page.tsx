import type { Metadata } from "next";
import LegalPageView from "@/components/LegalPageView";
import { findLegalPage } from "@/lib/legal";

export const revalidate = 3600;

const page = findLegalPage("datenschutz")!;

export const metadata: Metadata = {
  title: page.heading,
  description: page.description,
  robots: { index: false },
};

export default function DatenschutzPage() {
  return <LegalPageView slug="datenschutz" />;
}
