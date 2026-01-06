import type { Metadata } from "next";
import { Inter, Merriweather, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import MobileNav from "@/components/ui/MobileNav";
import Footer from "@/components/ui/Footer";
import SessionProvider from "@/components/providers/SessionProvider";

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

export const metadata: Metadata = {
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Novesia - Baca Novel Terbaik",
    description: "Platform baca novel web terbaik dengan pengalaman membaca yang imersif.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
};

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
