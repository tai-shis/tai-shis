import Skills from "./skills";
import Experience from "./experience";
import Projects from "./projects";
import Education from "./education";

export default function Resume() {
  return (
    <div className="w-full flex flex-col gap-4">
      <Skills />
      <Experience />
      <Projects />
      <Education />
    </div>
  );
}
