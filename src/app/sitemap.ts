import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = createAdminClient();
  const { data: venues } = await client
    .from("organizations")
    .select("slug,updated_at")
    .eq("is_active", true)
    .order("created_at");
  const pages = ["", "/register", "/privacy", "/terms"];

  return [
    ...pages.map((path) => ({
      url: new URL(path || "/", SITE_URL).toString(),
      lastModified: new Date(),
      changeFrequency: path ? ("monthly" as const) : ("weekly" as const),
      priority: path ? 0.6 : 1,
    })),
    ...(venues ?? []).map((venue) => ({
      url: new URL(`/book/${venue.slug}`, SITE_URL).toString(),
      lastModified: new Date(venue.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
