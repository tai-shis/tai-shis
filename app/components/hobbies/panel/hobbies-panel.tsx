import Preface from "./preface";
import Stats from "./stats";
import CTA from "./cta";

export default function HobbiesPanel() {
  return (
    <div className="w-full flex flex-col gap-4">
      <Preface />
      <CTA />
      <Stats />
    </div>
  );
}