export function Chip({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span className={`px-1.5 py-0.5 bg-background border text-sm ${accent ? "border-accent text-accent" : "border-border text-muted"}`}>
      {label}
    </span>
  );
}

export function Bullet({ text }: { text: string }) {
  return (
    <li className="flex gap-2 text-muted">
      <span className="text-border-accent shrink-0 select-none">›</span>
      <span>{text}</span>
    </li>
  );
}

export function Divider() {
  return <div className="border-t border-border my-3" />;
}
