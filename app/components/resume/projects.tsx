import Panel from "@/app/components/panel";
import { Bullet, Chip, Divider } from "@/app/components/shared";

const projects = [
  {
    title: "Stoa",
    stack: ["React", "TypeScript", "Tauri", "Convex", "TailwindCSS", "WorkOS"],
    date: "Mar. 2026 – Present",
    bullets: [
      "Shipped features incrementally alongside a team using Git branching workflows to keep parallel work conflict-free",
      "Translated feature requirements into tracked tasks via Agile sprints, managing scope across the team",
      "Prototyped UI flows and iterated with teammates through design reviews to refine the end-user experience",
      "Built a file-upload system with a custom UI and status menu, serving resized copies to cut media costs by 80%",
      "Diagnosed and resolved cross-platform compatibility bugs spanning Windows, macOS, and Linux",
    ],
  },
  {
    title: "Urban Pulse",
    stack: ["Next.js", "Prisma", "PostgreSQL", "Ollama", "AWS S3"],
    date: "Oct. 2025 – Oct. 2025",
    note: "Hack the Change 2025",
    bullets: [
      "Built the backend for Urban Pulse, an urban incident-reporting system, in a 4-person team during a hackathon focused on software for positive social impact",
      "Enabled secure report CRUD and pagination by building a dozen type-safe Next.js server actions with per-user authorization and server-side validation",
      "Designed a 1-to-5 star rating system with composite-key vote upserts, denormalizing each report's average rating for fast reads",
      "Integrated a vision LLM (Llama 3.2 11B) via an OpenAI-compatible API, letting users report issues with just a photo – auto-generating descriptions with prompt engineering and moderation fallbacks",
    ],
  },
];

export default function Projects() {
  return (
    <Panel name="projects" className="p-4 relative">
      <div className="px-2 flex flex-col text-sm">
        {projects.map((p, i) => (
          <div key={p.title}>
            {i > 0 && <Divider />}
            <div className="flex justify-between items-baseline gap-2">
              <span className="font-bold text-muted group-hover:text-accent transition-colors">
                {p.title}{"note" in p && p.note ? <span className="font-normal text-muted ml-2">— {p.note}</span> : null}
              </span>
              <span className="text-muted shrink-0">{p.date}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {p.stack.map((s) => <Chip key={s} label={s} />)}
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {p.bullets.map((b) => <Bullet key={b} text={b} />)}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  );
}
