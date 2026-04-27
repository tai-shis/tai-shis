interface PanelProps {
  name: string;
  children?: React.ReactNode;
  className?: string;
}

export default function Panel({ name, children, className }: PanelProps) {
  return (
    <div className={`p-2 tui-panel relative group hover:border-border-accent transition-colors ${className ?? ""}`}>
      <span className="absolute top-0 left-3 -translate-y-1/2 px-1 bg-surface text-muted text-sm transition-colors group-hover:text-border-accent">
        {name}
      </span>
      {children}
    </div>
  );
}
