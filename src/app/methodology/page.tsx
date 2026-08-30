import type { Metadata } from "next";
import { MethodologyClient } from "./MethodologyClient";

export const metadata: Metadata = {
  title: "Scoring Methodology - PetFoodSmart",
  description:
    "How PetFoodSmart scores pet food ingredients. Transparent algorithm documentation including data sources, scoring rules, grade thresholds, and limitations.",
};

export default function MethodologyPage() {
  return <MethodologyClient />;
}
