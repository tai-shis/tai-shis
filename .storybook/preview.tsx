import type { Preview } from "@storybook/nextjs-vite";
import { Geist_Mono } from "next/font/google";
import "../app/globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Mirrors app/layout.tsx, which puts these on <html> and <body>. Dialogs portal to <body>,
// so a wrapper element around the story would not reach them.
document.documentElement.classList.add(geistMono.variable, "antialiased", "bg-background");
document.body.classList.add("text-muted");

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
