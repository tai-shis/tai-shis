import Shell from "@/app/components/shell";
import HomePanel from "@/app/components/home/home-panel";
import ProjectsPanel from "@/app/components/projects/projects-panel";
import ResumePanel from "@/app/components/resume/resume-panel";
import HobbiesPanel from "@/app/components/hobbies/panel/hobbies-panel";
import Footer from "@/app/components/footer";

export default function Home() {
  return (
    <>
      <Shell>
        <HomePanel />
        <ProjectsPanel />
        <ResumePanel />
        <HobbiesPanel />
      </Shell>
      <Footer />
    </>
  );
}
