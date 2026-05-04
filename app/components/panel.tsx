interface PanelProps {
  name: string;
  children?: React.ReactNode;
  className?: string;
  active?: boolean;
}

export default function Panel({ name, children, className, active }: PanelProps) {
  return (
    <div data-panel className={`p-2 tui-panel relative group hover:border-border-accent transition-colors ${active ? "border-border-accent" : ""} ${className ?? ""}`}>
      <span className={`absolute top-0 left-3 -translate-y-1/2 bg-background px-1.5 text-sm transition-colors group-hover:text-accent ${active ? "text-accent" : "text-muted"}`}>
        {name}
      </span>
      {children}
    </div>
  );
}
