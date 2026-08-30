import { Cat, Dog } from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { BrandPetType } from "@/lib/brands/types";

interface PetTypeIconProps extends Omit<LucideProps, "ref"> {
  petType: BrandPetType;
}

/** Renders a cat or dog SVG icon for the given pet type. */
export function PetTypeIcon({ petType, ...props }: PetTypeIconProps) {
  const Icon = petType === "cat" ? Cat : Dog;
  return <Icon aria-hidden="true" {...props} />;
}
