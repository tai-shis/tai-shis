import ProjectTemplate from "./project-template";

export default function UrbanPulse() {
  return (
    <ProjectTemplate
      panelName="urban-pulse"
      description="Modern web application for reporting and viewing urban issues for local businesses and people. Build for Hack the Change 2025"
      tags={["Next.js", "TypeScript", "React", "Prisma", "NeonDB", "Neon Auth", "TailwindCSS", "Vercel", "Ollama", "AWS S3"]}
      link="https://github.com/at-mojo/urban-pulse-htc2025"
      hackathon={true}
    />
  );
}
  