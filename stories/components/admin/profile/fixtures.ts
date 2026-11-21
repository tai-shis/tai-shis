import { fn } from "storybook/test";
import type { ProfileMutationResult, ProfileRow, ProfileRowActions } from "@/app/lib/profile/tables";

export const SAVE_FAILED: ProfileMutationResult = { ok: false, error: "Unable to save the change. Try again." };

export const experienceRows: ProfileRow[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    visible: true,
    values: {
      role: "Software Developer Intern",
      company: "Vendor Reports Inc.",
      location: "Calgary, AB",
      startDate: "05-2025",
      endDate: "08-2025",
      summary: "Built reporting pipelines for vendor data.",
      highlights: "Cut report generation time in half\nMigrated cron jobs to queues",
    },
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    visible: false,
    values: {
      role: "Teaching Assistant",
      company: "Mount Royal University",
      location: "",
      startDate: "09-2024",
      endDate: "",
      summary: "",
      highlights: "",
    },
  },
];

export const longTitleRow: ProfileRow = {
  id: "00000000-0000-4000-8000-000000000003",
  visible: true,
  values: {
    role: "Senior Principal Distinguished Staff Software Engineering Lead Architect",
    company: "An Extremely Long Company Name That Keeps Going Incorporated",
    location: "",
    startDate: "",
    endDate: "",
    summary: "",
    highlights: "",
  },
};

export const qaRows: ProfileRow[] = [
  {
    id: "00000000-0000-4000-8000-000000000010",
    visible: true,
    values: {
      question: "Why do you build terminal-styled interfaces?",
      answer: "They force every element to earn its place.",
      topic: "design",
    },
  },
];

export function createProfileRowActions(): ProfileRowActions {
  return {
    create: fn(async (): Promise<ProfileMutationResult> => ({ ok: true })),
    update: fn(async (): Promise<ProfileMutationResult> => ({ ok: true })),
    remove: fn(async (): Promise<ProfileMutationResult> => ({ ok: true })),
    setVisibility: fn(async (): Promise<ProfileMutationResult> => ({ ok: true })),
  };
}
