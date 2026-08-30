/**
 * F008 - Pet Profile localStorage Persistence
 */

import type { PetProfile } from "./types";

export const STORAGE_KEY = "petfoodsmart_pet_profile";

/** Save a pet profile to localStorage */
export function saveProfile(profile: PetProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/** Load pet profile from localStorage, or null if not found/corrupted */
export function loadProfile(): PetProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PetProfile;
  } catch {
    return null;
  }
}

/** Clear the stored pet profile */
export function clearProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}
