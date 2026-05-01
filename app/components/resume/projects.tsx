import Panel from "@/app/components/panel";
import { Bullet, Chip, Divider } from "@/app/components/shared";

const projects = [
  {
    title: "Vendor Report Webapp",
    stack: ["Next.js", "TypeScript", "Bun", "PostgreSQL", "Square SDK", "Git"],
    date: "Jan. 2026 – Present",
    bullets: [
      "Independently designing and building a full-stack web app for a pre-launch retail business, giving 20+ consignment vendors self-serve access to sales data previously only visible to store administrators",
      "Integrated the Square API to ingest live transaction data, parsing and attributing ~2,000 orders into 3,500 vendor-specific entries for per-vendor reporting",
      "Designed a PostgreSQL schema to model the store's unique consignment workflow, enabling accurate vendor-level attribution of shared-storefront sales",
      "Implemented role-based authentication distinguishing vendor and admin accounts, ensuring vendors can only access their own private sales data",
      "Built interactive dashboards surfacing sales history and orders-over-time charts, replacing a month-end manual reporting process with real-time visibility",
      "Conducted user interviews with real vendors to validate UI decisions and iterate on pain points before launch",
    ],
  },
  {
    title: "Stoa",
    stack: ["React", "TypeScript", "Git", "Convex"],
    date: "Mar. 2026 – Present",
    bullets: [
      "Shipped features incrementally alongside a team using Git branching workflows to keep parallel work conflict-free",
      "Translated feature requirements into tracked tasks via Agile sprints, managing scope across the team",
      "Prototyped UI flows and iterated with teammates through design reviews to refine the end-user experience",
      "Strengthened code quality through regular code reviews and pair programming sessions",
      "Diagnosed and resolved cross-platform compatibility bugs spanning Windows, macOS, and Linux",
    ],
  },
  {
    title: "Urban Pulse",
    stack: ["Next.js", "TypeScript", "Prisma", "NeonDB", "Ollama", "AWS S3"],
    date: "Oct. 2025",
    note: "Hack the Change 2025",
    bullets: [
      "Built the backend in a 24-hour hackathon for a full-stack web app letting residents report and view urban infrastructure issues",
      "Designed the Postgres schema with Prisma and NeonDB, and implemented authentication and session management with Neon Auth",
      "Integrated AWS S3 for user-uploaded issue photos using presigned URLs for direct client-to-bucket uploads",
      "Wired up API calls to a remote Ollama LLM hosted on a teammate's server, enabling AI-powered features without external API dependencies",
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
