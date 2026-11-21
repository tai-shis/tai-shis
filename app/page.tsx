import CarouselPage from "@/app/components/carousel-page";
import HomePanel from "@/app/components/home/home-panel";
import ProjectsPanel from "@/app/components/projects/projects-panel";
import ResumePanel from "@/app/components/resume/resume-panel";
import HobbiesPanel from "@/app/components/hobbies/panel/hobbies-panel";
import ChatPanel from "@/app/components/chat/chat-panel";

const SECTIONS = ["home", "projects", "resume", "hobbies", "chat"];

export default function Home() {
  return (
    <CarouselPage title="Tai Shishiba" sections={SECTIONS}>
      <HomePanel />
      <ProjectsPanel />
      <ResumePanel />
      <HobbiesPanel />
      <ChatPanel />
    </CarouselPage>
  );
}
