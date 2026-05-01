import Stoa from "./stoa";
import VendorReports from "./vendor-reports";


import SpaceInvaders from "./space-invaders";
import RegisterAllocator from "./register-allocator";
import UrbanPulse from "./urban-pulse";
import SystemDesign from "./system-design";

export default function ProjectsPanel() {
  return (
    <div className="w-full flex flex-col gap-4">
      <VendorReports />
      <Stoa />
      <UrbanPulse />
      <SystemDesign />
      <RegisterAllocator />
      <SpaceInvaders />
    </div>
  );
}