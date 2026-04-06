import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import { getServerSession } from "next-auth";
import Script from "next/script";
import "./globals.css";
import { authOptions } from "@/auth";
import { RootProviders } from "@/components/root-providers";
import { getAppearanceBootstrapScript } from "@/lib/appearance";

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
});

export const metadata: Metadata = {
  title: "OctoHome | The GitHub Home App for Everyone",
  description: "Run your household using GitHub Issues with a magical, family-friendly interface.",
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="en"
      className={atkinson.variable}
      data-theme="aether"
      data-color-scheme="light"
      data-effects="full"
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground antialiased min-h-screen">
        <Script
          id="appearance-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: getAppearanceBootstrapScript() }}
        />
        <RootProviders session={session}>{children}</RootProviders>
      </body>
    </html>
  );
}
