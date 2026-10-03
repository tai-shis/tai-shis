import { home } from "./home";
import { projects } from "./projects";
import { resume } from "./resume";
import { hobbies } from "./hobbies";
import { fillVerb } from "./verb";

const footer = `---

© 2026 - tai-shis
`;

// Page order and headings mirror the site's nav.
const pages: { slug: string; title: string; sections: string[] }[] = [
  { slug: "home", title: "[1] home", sections: [home.me, home.socials, home.about, home.propaganda, home.vouches] },
  {
    slug: "projects",
    title: "[2] projects",
    sections: [
      projects.vendorReports,
      projects.stoa,
      projects.urbanPulse,
      projects.systemDesign,
      projects.registerAllocator,
      projects.spaceInvaders,
    ],
  },
  {
    slug: "resume",
    title: "[3] resume",
    sections: [resume.intro, resume.education, resume.experience, resume.projects, resume.skills],
  },
  { slug: "hobbies", title: "[4] hobbies", sections: [hobbies.preface, hobbies.stats] },
];

// Renders the whole site, or just one page when `slug` matches (e.g. "resume").
export function renderCurl(slug?: string): string {
  const selected = pages.filter((p) => !slug || p.slug === slug);
  const body = (selected.length ? selected : pages)
    .map(({ title, sections }) => [`## ${title}\n`, ...sections].join("\n"))
    .join("\n");

  return fillVerb(`# tai-shis\n\n${body}\n${footer}`);
}
