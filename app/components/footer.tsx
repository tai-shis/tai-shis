import { GitPullRequest } from 'lucide-react';
import { execSync } from "child_process";
import Panel from "@/app/components/panel";
import AuthDialog from "@/app/components/auth/auth-dialog";

function getLastCommit(): string | null {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync("git rev-parse HEAD", { cwd: process.cwd() })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function capitalize(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export type FooterProps = {
  /** The nav labels, listed in the shortcut hint. */
  sections: string[];
  /** Replaces the copyright line at the start of the footer. */
  start?: React.ReactNode;
  /** Shown centered in the footer on wider screens. */
  center?: React.ReactNode;
};

export default function Footer({ sections, start = <span className="p-2">© 2026 - tai-shis</span>, center }: FooterProps) {
  const commit = getLastCommit();
  const shortcutHint = sections.map((label, i) => `${i + 1}: ${capitalize(label)}`).join(" | ");
  const shortCommit = commit ? commit.slice(0, 7) : null;
  const commitURL = commit ? `https://github.com/tai-shis/tai-shis.com/commit/${commit}` : '';

  return (
    <footer className="order-first sm:order-none">
      <Panel
        name={
          <>
            <span className="sm:hidden">header</span>
            <span className="hidden sm:inline">footer</span>
          </>
        }
        heading={false} className="flex items-center px-4 py-2 text-sm text-muted relative z-10">
        {start}
        {center && <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block">{center}</div>}
        <div className="ml-auto sm:hidden">
          <AuthDialog />
        </div>
        <a href={commitURL} target="_blank" rel="noopener noreferrer" className="hover:text-sunset transition-colors p-2 hidden sm:flex flex-row items-center justify-center gap-1 ml-auto">
          <GitPullRequest size={16}/> {shortCommit ?? "—"}
        </a>
        <span className="absolute bottom-0 left-3 translate-y-1/2 bg-background px-1.5 text-muted text-xs font-mono transition-colors group-hover:text-accent hidden sm:block">
          [{shortcutHint}]
        </span>
        <span className="absolute bottom-0 right-3 translate-y-1/2 bg-background px-1.5 text-muted text-xs font-mono transition-colors group-hover:text-accent hidden sm:block">
          [↑/↓ Panel | ←/→ Scroll]
        </span>
      </Panel>
    </footer>
  );
}
