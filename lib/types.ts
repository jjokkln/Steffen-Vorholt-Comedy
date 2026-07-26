export interface Show {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  format_label: string;
  hint_text: string; // kleiner Aktions-/Hinweistext, z. B. „Mit Code XY nur 5 €"
  color: string;
  planet_image_path: string;
  background_image_path: string;
  header_image_path: string;
  principle_items: { title: string; text: string }[];
  cities_text: string;
  sort_order: number;
  is_active: boolean;
}

export type ShowImageCategory = "location" | "show";

export const SHOW_IMAGE_CATEGORIES: { key: ShowImageCategory; label: string }[] = [
  { key: "location", label: "Location" },
  { key: "show", label: "Show" },
];

export interface ShowImage {
  id: string;
  show_id: string;
  image_path: string;
  alt_text: string;
  category: ShowImageCategory;
  sort_order: number;
}

export type VideoOrientation = "landscape" | "portrait";

export interface ShowVideo {
  id: string;
  show_id: string;
  video_path: string;
  poster_path: string;
  title: string;
  orientation: VideoOrientation;
  sort_order: number;
}

export interface EventRow {
  id: string;
  show_id: string;
  date: string; // ISO yyyy-mm-dd
  start_time: string;
  entry_time: string;
  city: string;
  venue: string;
  ticket_url: string;
  provider: string;
  is_published: boolean;
  shows?: Pick<Show, "name" | "slug" | "color"> | null; // bei Join
}

export type InquiryType = "booking_show" | "booking_steffen" | "frage_feedback";
export type InquiryStatus = "new" | "read" | "answered";

// Labels inkl. Legacy-Werte ('booking','comedian') für bereits gespeicherte Anfragen.
export const INQUIRY_LABELS: Record<string, string> = {
  booking_show: "Booking: Show",
  booking_steffen: "Booking: Steffen",
  frage_feedback: "Frage / Feedback",
  booking: "Booking (alt)",
  comedian: "Comedian (alt)",
};

// Beschriftungen der typ-spezifischen payload-Felder (Admin-Mail + Anfragen-Liste).
export const INQUIRY_FIELD_LABELS: Record<string, string> = {
  show: "Show",
  event_date: "Wunschdatum",
  city: "Stadt / Location",
  video_requested: "Video gewünscht",
  company: "Firma / Veranstalter",
  event_type: "Art der Veranstaltung",
};

export interface Inquiry {
  id: string;
  type: InquiryType;
  name: string;
  email: string;
  phone: string;
  message: string;
  payload: Record<string, string>;
  status: InquiryStatus;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  image_path: string;
  caption: string;
  category: string; // "steffen" | "shows" | "locations" | "" (unkategorisiert)
  sort_order: number;
}

export const GALLERY_CATEGORIES: { key: string; label: string }[] = [
  { key: "steffen", label: "Steffen" },
  { key: "shows", label: "Shows" },
  { key: "locations", label: "Locations" },
];

export interface Comedian {
  id: string;
  name: string;
  age: number | null;
  bio: string;
  photo_path: string;
  instagram_url: string;
  tiktok_url: string;
  youtube_url: string;
  website_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface ShowComedian {
  id: string;
  show_id: string;
  comedian_id: string;
  role: string;
  sort_order: number;
  comedians?: Comedian | null; // bei Join
}

export interface YoutubeVideo {
  id: string;
  show_id: string | null; // null = globale Referenz (Homepage/Comedian/Archiv)
  youtube_id: string;
  title: string;
  sort_order: number;
}

export type AppearanceKind = "open_mic" | "guest" | "gig" | "show";

export interface Appearance {
  id: string;
  title: string;
  organizer: string;
  city: string;
  venue: string;
  date: string | null; // ISO yyyy-mm-dd oder null
  url: string;
  kind: AppearanceKind;
  color: string;
  flyer_path: string;
  sort_order: number;
  is_published: boolean;
}

export interface Partner {
  id: string;
  name: string;
  url: string;
  logo_path: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface OneLiner {
  id: string;
  text: string;
  is_active: boolean;
}

export interface Offer {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image_path: string;
  code: string;
  validity: string;
  url: string;
  sort_order: number;
  is_active: boolean;
}
