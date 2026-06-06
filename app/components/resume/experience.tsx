import Panel from "@/app/components/panel";
import { Bullet, Chip, Divider } from "@/app/components/shared";

const experience = [
  {
    title: "Vendor Report Webapp",
    org: "Freelance Software Developer, All Through The House",
    location: "Okotoks, AB",
    date: "Jan. 2026 – Present",
    stack: ["Next.js", "TypeScript", "Prisma", "NeonDB", "Square SDK", "Playwright", "Axiom", "Resend"],
    bullets: [
      "Built and maintain a B2B web application that replaced admin-only reporting with self-serve vendor access",
      "Integrated the Square SDK to ingest live transaction data, parsing and attributing over 7,000 orders into 10,000 vendor-specific entries for per-vendor reporting",
      "Modeled the consignment workflow with Prisma over NeonDB Postgres, working around Square's lack of a native vendor concept to attribute sales across a shared storefront",
      "Designed a role-based access system using separate vendor, admin, and unassigned permission groups, supporting users tied to multiple vendor accounts",
      "Built interactive dashboards surfacing sales history and orders-over-time charts, replacing month-end manual reporting and eliminating an estimated 120+ weekly sales-data requests to the store owner",
      "Ran UX surveys and used Playwright tests to fix onboarding and sign-in issues for non-technical users",
      "Reduced API call latency from 500ms to 300ms (40%) through caching and query optimization",
    ],
  },
  {
    title: "Undergraduate Research Assistant",
    org: "Mount Royal University",
    location: "Calgary, AB",
    date: "May 2025 – Aug. 2025",
    bullets: [
      "Built Python visualization pipelines using NumPy and Matplotlib to analyze simulation outputs for malware propagation research in wireless sensor networks",
      "Prototyped simulations using emerging research libraries to model malware spread patterns, enabling the team to evaluate new modeling approaches",
      "Authored LaTeX technical documentation of experimental methodology and results for research publication",
    ],
  },
];

export default function Experience() {
  return (
    <Panel name="experience" className="p-4 relative">
      <div className="px-2 flex flex-col text-sm">
        {experience.map((e, i) => (
          <div key={e.title}>
            {i > 0 && <Divider />}
            <div className="flex justify-between items-baseline gap-2">
              <span className="font-bold text-muted group-hover:text-accent transition-colors">{e.title}</span>
              <span className="text-muted shrink-0">{e.date}</span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-muted">{e.org}</span>
              <span className="text-muted">{e.location}</span>
            </div>
            {"stack" in e && e.stack ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {e.stack.map((s) => <Chip key={s} label={s} />)}
              </div>
            ) : null}
            <ul className="mt-2 flex flex-col gap-1">
              {e.bullets.map((b) => <Bullet key={b} text={b} />)}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  );
}
