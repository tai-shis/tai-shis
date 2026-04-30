interface PanelProps {
  name: string;
  children?: React.ReactNode;
  className?: string;
}

export default function Panel({ name, children, className }: PanelProps) {
  return (
    <div data-panel className={`p-2 tui-panel relative group hover:border-border-accent transition-colors ${className ?? ""}`}>
      <span className="absolute top-0 left-3 -translate-y-1/2 bg-background px-1.5 text-muted text-sm transition-colors group-hover:text-accent">
        {name}
      </span>
      {children}
    </div>
  );
}
