export const resume = {
  intro: `### resume

I enjoy making things, leaning more toward software development in typescript and react.
I started programming in University and have been falling deeper into it ever since.
The main reason I enjoy programming so much, is because of the possibilities it opens up to create things that help people.
Building and creating things that can be used by others - that can make their experience just a little better - is what
drives me to keep learning and improving my skills.
`,

  education: `### education

**Mount Royal University** - Calgary, AB
*Bachelor of Science in Computer Science* (Sept. 2023 – Expected Apr. 2028)

- Cumulative GPA: 3.91 / 4.00
- Dean's Honour Roll (6 consecutive semesters)
- President's Honour Roll (3 consecutive years)
- Relevant Courses: Algorithms and Complexity, System Design, Introduction to Databases, Software Engineering, Web Development, Operating Systems, Human-Computer Interaction, Artificial Intelligence
`,

  experience: `### experience

**Freelance Software Developer** - All Through The House, Okotoks, AB
*Jan. 2026 – Current*

- **stack:** Next.js, Prisma, PostgreSQL, Square SDK, Vitest
- Built and maintain a production B2B consignment-reporting platform, replacing manual admin reporting with self-serve vendor access across 30+ API routes and 14 data models
- Cut 120+/week vendor sales-data and statement requests to the business owner, by designing an incremental statement-generation pipeline that converts Square transactions into per-vendor payout statements
- Attributed 7,000+ Square orders into 15,000+ vendor-specific entries, by integrating the Square SDK and modeling a vendor concept absent from Square's native API
- Cut analytics API latency 34% (532ms to 347ms), by batching five aggregation queries into a single SQL query with materialized CTEs
- Built a 300-case Vitest suite across 28 modules with zero DB or network dependencies, wiring it into a GitHub Action for fast, deterministic CI runs

**Undergraduate Research Assistant** - Mount Royal University, Calgary, AB
*May 2025 – Aug. 2025*

- **stack:** Python, NumPy, Matplotlib, LaTeX
- Built Python visualization pipelines using NumPy and Matplotlib to analyze simulation outputs for malware propagation research in wireless sensor networks
- Prototyped simulations using emerging research libraries to model malware spread patterns, enabling the team to evaluate new modeling approaches
- Authored LaTeX technical documentation of experimental methodology and results for research publication
`,

  projects: `### projects

**Stoa**
*Mar. 2026 – Present*

- **stack:** React, TypeScript, Tauri, Convex, TailwindCSS, WorkOS
- Shipped features incrementally alongside a team using Git branching workflows to keep parallel work conflict-free
- Translated feature requirements into tracked tasks via Agile sprints, managing scope across the team
- Prototyped UI flows and iterated with teammates through design reviews to refine the end-user experience
- Built a file-upload system with a custom UI and status menu, serving resized copies to cut media costs by 80%
- Diagnosed and resolved cross-platform compatibility bugs spanning Windows, macOS, and Linux

**Urban Pulse** - Hack the Change 2025
*Oct. 2025 – Oct. 2025*

- **stack:** Next.js, Prisma, PostgreSQL, Ollama, AWS S3
- Built the backend for Urban Pulse, an urban incident-reporting system, in a 4-person team during a hackathon focused on software for positive social impact
- Enabled secure report CRUD and pagination by building a dozen type-safe Next.js server actions with per-user authorization and server-side validation
- Designed a 1-to-5 star rating system with composite-key vote upserts, denormalizing each report's average rating for fast reads
- Integrated a vision LLM (Llama 3.2 11B) via an OpenAI-compatible API, letting users report issues with just a photo – auto-generating descriptions with prompt engineering and moderation fallbacks
`,

  skills: `### technical-skills

\`\`\`
languages:  JavaScript/TypeScript, Python, SQL, Java, C/C++, HTML/CSS, Assembly, Nix
frameworks: React, Next.js, Express, Convex, Neon, Prisma, Drizzle, Hono, WorkOS, Clerk
tools:      Git, GitHub, VSCode, Postman, Emacs, Claude, Sentry
testing:    Playwright, Vitest, Pytest, GitHub Actions
libraries:  TailwindCSS, NumPy, Matplotlib, Mongoose, Shadcn, Radix UI, BetterAuth, Square SDK, Resend, Axiom
\`\`\`
`,
};
