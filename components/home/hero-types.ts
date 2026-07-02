export type HeroPlanetRole = "primary" | "secondary" | "tertiary";

export interface HeroPlanet {
  id: string;
  slug: string;
  name: string;
  color: string;
  imageUrl: string;
  role: HeroPlanetRole;
}
