import { notFound, permanentRedirect } from "next/navigation";

export default async function LegacyTenantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();
  permanentRedirect(`/book/${slug}`);
}
