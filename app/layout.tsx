import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StandCon",
  description: "SITCON Game：滲透 StandCon 並救出 Yoru",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  );
}
