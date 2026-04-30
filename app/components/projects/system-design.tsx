import ProjectTemplate from "@/app/components/projects/project-template";

export default function SystemDesign() {
  return (
    <ProjectTemplate
      panelName="system-design"
      description="A documentation-style resource compiled from a system design course, covering fundamental concepts and best practices in designing scalable and efficient systems."
      tags={["Typescript", "React", "Next.js", "Git", "NeetCode", "System Design"]}
      link="https://github.com/tai-shis/comp4299-system-design"
      school={true}
    />
  );
}
  