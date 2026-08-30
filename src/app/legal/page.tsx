import type { Metadata } from "next";
import { LegalPageClient } from "./LegalPageClient";

export const metadata: Metadata = {
  title: "Legal Disclaimer - PetFoodSmart",
  description:
    "Legal disclaimer for PetFoodSmart pet food ingredient scanner. Grades are algorithmic assessments for reference only.",
};

export default function LegalPage() {
  return <LegalPageClient />;
}
