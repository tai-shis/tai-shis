import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tai Shishiba - Software Developer",
  description: "",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased bg-background`}
    >
      <body className="h-full overflow-hidden flex flex-col">
        <div className="w-full max-w-3xl mx-auto flex flex-col h-full px-4 py-8 gap-4 text-muted">
          {children}
        </div>
      </body>
    </html>
  );
}
