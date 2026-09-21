import Panel from "@/app/components/panel";
import { Bullet, Chip, Divider } from "@/app/components/shared";

const experience = [
  {
    title: "Freelance Software Developer",
    org: "All Through The House",
    location: "Okotoks, AB",
    date: "Jan. 2026 – Current",
    stack: ["Next.js", "Prisma", "PostgreSQL", "Square SDK", "Vitest"],
    bullets: [
      "Built and maintain a production B2B consignment-reporting platform, replacing manual admin reporting with self-serve vendor access across 30+ API routes and 14 data models",
      "Cut 120+/week vendor sales-data and statement requests to the business owner, by designing an incremental statement-generation pipeline that converts Square transactions into per-vendor payout statements",
      "Attributed 7,000+ Square orders into 15,000+ vendor-specific entries, by integrating the Square SDK and modeling a vendor concept absent from Square's native API",
      "Cut analytics API latency 34% (532ms to 347ms), by batching five aggregation queries into a single SQL query with materialized CTEs",
      "Built a 300-case Vitest suite across 28 modules with zero DB or network dependencies, wiring it into a GitHub Action for fast, deterministic CI runs",
    ],
  },
  {
    title: "Undergraduate Research Assistant",
    org: "Mount Royal University",
    location: "Calgary, AB",
    date: "May 2025 – Aug. 2025",
    stack: ["Python", "NumPy", "Matplotlib", "LaTeX"],
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
