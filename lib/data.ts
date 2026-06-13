import { createPublicClient } from "@/lib/supabase/public";
import type { EventRow, GalleryItem, OneLiner, Show, ShowVideo } from "@/lib/types";

const EVENT_SELECT = "*, shows(name, slug, color)";

export async function getActiveShows(): Promise<Show[]> {
  const { data, error } = await createPublicClient()
    .from("shows").select("*").eq("is_active", true).order("sort_order");
  if (error) throw new Error(`getActiveShows: ${error.message}`);
  return data as Show[];
}

export async function getShowBySlug(slug: string): Promise<Show | null> {
  const { data, error } = await createPublicClient()
    .from("shows").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) throw new Error(`getShowBySlug: ${error.message}`);
  return data as Show | null;
}

export async function getPublishedEvents(): Promise<EventRow[]> {
  const { data, error } = await createPublicClient()
    .from("events").select(EVENT_SELECT).eq("is_published", true).order("date");
  if (error) throw new Error(`getPublishedEvents: ${error.message}`);
  return data as EventRow[];
}

export async function getEventsForShowId(showId: string): Promise<EventRow[]> {
  const { data, error } = await createPublicClient()
    .from("events").select(EVENT_SELECT).eq("is_published", true).eq("show_id", showId).order("date");
  if (error) throw new Error(`getEventsForShowId: ${error.message}`);
  return data as EventRow[];
}

export async function getVideosForShowId(showId: string): Promise<ShowVideo[]> {
  const { data, error } = await createPublicClient()
    .from("show_videos").select("*").eq("show_id", showId).order("sort_order");
  // Tolerant, falls die Migration 0002 (Tabelle show_videos) noch nicht eingespielt ist:
  // Deployment bleibt reihenfolge-unabhängig, Videos erscheinen, sobald die Tabelle existiert.
  if (error?.code === "PGRST205") return [];
  if (error) throw new Error(`getVideosForShowId: ${error.message}`);
  return data as ShowVideo[];
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const { data, error } = await createPublicClient()
    .from("gallery_items").select("*").order("sort_order");
  if (error) throw new Error(`getGalleryItems: ${error.message}`);
  return data as GalleryItem[];
}

export async function getActiveOneLiners(): Promise<OneLiner[]> {
  const { data, error } = await createPublicClient()
    .from("one_liners").select("*").eq("is_active", true);
  if (error) throw new Error(`getActiveOneLiners: ${error.message}`);
  return data as OneLiner[];
}

export async function getLegalContent(slug: string): Promise<string> {
  const { data, error } = await createPublicClient()
    .from("legal_pages").select("content").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`getLegalContent: ${error.message}`);
  return data?.content ?? "";
}

export async function getSiteMedia(key: string): Promise<string> {
  const { data, error } = await createPublicClient()
    .from("site_media").select("file_path").eq("key", key).maybeSingle();
  if (error) throw new Error(`getSiteMedia: ${error.message}`);
  return data?.file_path ?? "";
}
