import type { Metadata } from "next";
import { Inter, Merriweather, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import MobileNav from "@/components/ui/MobileNav";
import Footer from "@/components/ui/Footer";
import SessionProvider from "@/components/providers/SessionProvider";
import { prisma } from "@/lib/prisma";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-merriweather",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

// Fetch OG image URL from settings
async function getOgImageUrl(): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "brandingOgImageUrl" }
    })
    if (setting?.value) {
      return JSON.parse(setting.value)
    }
  } catch (error) {
    console.error("Error fetching OG image:", error)
  }
  // Fallback - try common extensions
  return "https://pub-d7fdf7a6932b4febbd724bd48ae0c2c3.r2.dev/branding/og-image.webp"
}

// Dynamic metadata
export async function generateMetadata(): Promise<Metadata> {
  const ogImageUrl = await getOgImageUrl()

  return {
    title: "Novesia - Baca Novel Terbaik",
    description: "Platform baca novel web terbaik dengan pengalaman membaca yang imersif. Ribuan novel terjemahan berkualitas dalam Bahasa Indonesia.",
    keywords: ["novel", "web novel", "baca novel", "novel terjemahan", "novel indonesia"],
    authors: [{ name: "Novesia" }],
    manifest: "/manifest.json",
    themeColor: "#6366f1",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Novesia",
    },
    openGraph: {
      title: "Novesia - Baca Novel Terbaik",
      description: "Platform baca novel web terbaik dengan pengalaman membaca yang imersif.",
      type: "website",
      locale: "id_ID",
      siteName: "Novesia",
      images: ogImageUrl ? [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Novesia - Platform Baca Novel Terbaik Indonesia",
      }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: "Novesia - Baca Novel Terbaik",
      description: "Platform baca novel web terbaik dengan pengalaman membaca yang imersif.",
      images: ogImageUrl ? [ogImageUrl] : [],
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/icons/icon-192.png",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${merriweather.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased min-h-screen pt-16 pb-24 md:pb-0">
        <SessionProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer />
          <MobileNav />
        </SessionProvider>
      </body>
    </html>
  );
}
