import ProjectTemplate from "@/app/components/projects/project-template";

export default function SpaceInvaders() {
  return (
    <ProjectTemplate
      panelName="space-invaders"
      description="Recreation of the classic arcade game in C and MC68000 assembly, running in an atari emulator with custom hardware drivers."
      tags={["C", "Assembly", "Atari", "Git"]}
      link="https://github.com/tai-shis/spaceinvaders"
      school={true}
    />
  );
}