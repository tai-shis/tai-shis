import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Tai Shishiba - Hobbymaxxer",
  description: "",
};

export default function HobbiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="">
      {children}
    </div>
  );
}