import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@phosphor-icons/web/regular";
import "@phosphor-icons/web/bold";
import "./globals.css";
import "@/styles/dc-states.css";
import { OmniProvider } from "@/components/OmniProvider";

export const metadata: Metadata = {
  title: "OmniPost AI",
  description: "Private, single-user AI social media management and automated publishing platform.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OmniProvider>{children}</OmniProvider>
      </body>
    </html>
  );
}
