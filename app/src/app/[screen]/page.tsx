import { notFound } from "next/navigation";
import { ScreenView } from "@/components/ScreenView";
import { ROUTES, isRoute } from "@/lib/routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ROUTES).map((screen) => ({ screen }));
}

export default async function ScreenPage({ params }: { params: Promise<{ screen: string }> }) {
  const { screen } = await params;
  if (!isRoute(screen)) notFound();
  return <ScreenView route={screen} />;
}
