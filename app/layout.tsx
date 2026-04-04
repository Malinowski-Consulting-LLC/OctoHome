import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";

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
  const session = await auth();

  return (
    <html lang="en" className={atkinson.variable}>
      <body className="bg-background text-foreground antialiased min-h-screen">
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
