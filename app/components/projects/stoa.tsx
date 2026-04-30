import ProjectTemplate from "@/app/components/projects/project-template";

export default function Stoa() {
  return (
    <ProjectTemplate
      panelName="stoa"
      description="A private communication platform built with a focus on privacy."
      tags={["TypeScript", "React", "Convex", "Rust", "Tauri", "Cloudflare R2"]}
      link="https://stoa.gg"
      personal={true}
      wip={true}
    />
  );
}
  