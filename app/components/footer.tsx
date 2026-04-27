import { execSync } from "child_process";
import Panel from "@/app/components/panel";

function getLastCommit(): string | null {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: process.cwd() })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

export default function Footer() {
  const commit = getLastCommit();

  return (
    <Panel name="footer" className="flex items-center justify-between px-4 py-2 text-sm text-muted">
      <span className="p-2">© 2026 - tai-shis</span>
      <a href={`#`} className="hover:text-foreground transition-colors p-2">
        {commit ?? "—"}
      </a>
    </Panel>
  );
}
