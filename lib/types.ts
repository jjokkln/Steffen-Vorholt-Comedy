export interface Show {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  format_label: string;
  color: string;
  planet_image_path: string;
  principle_items: { title: string; text: string }[];
  cities_text: string;
  sort_order: number;
  is_active: boolean;
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

export type InquiryType = "booking" | "comedian";
export type InquiryStatus = "new" | "read" | "answered";

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
  sort_order: number;
}

export interface OneLiner {
  id: string;
  text: string;
  is_active: boolean;
}
