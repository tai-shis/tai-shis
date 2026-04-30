import ProjectTemplate from "@/app/components/projects/project-template";

export default function RegisterAllocator() {
  return (
    <ProjectTemplate
      panelName="register-allocator"
      description="A register allocator for a simple compiler; implemented in both Python and Haskell."
      tags={["Python", "Haskell", "Git"]}
      link="https://github.com/tai-shis/comp3649-project"
      school={true}
    />
  );
}
  