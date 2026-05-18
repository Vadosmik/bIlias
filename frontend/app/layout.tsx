import type { Metadata } from "next";
import { Lexend_Deca, Noto_Serif_Georgian } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const lexend = Lexend_Deca({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

const notoSerif = Noto_Serif_Georgian({
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "bIlias — Platforma e-learningowa Uniwersytetu Morskiego w Gdyni",
  description: "Nowoczesna, intuicyjna platforma e-learningowa dla studentów i wykładowców UMG.",
  icons: {
    icon: '/images/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lexend.variable} ${notoSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
