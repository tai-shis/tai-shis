interface PanelProps {
  name: string;
  children?: React.ReactNode;
  className?: string;
  active?: boolean;
  heading?: boolean;
}

export default function Panel({ name, children, className, active, heading = true }: PanelProps) {
  const Container = heading ? "section" : "div";
  const Label = heading ? "h2" : "span";
  return (
    <Container data-panel className={`p-2 tui-panel relative group hover:border-border-accent transition-colors ${active ? "border-border-accent" : ""} ${className ?? ""}`}>
      <Label
        aria-hidden={heading ? undefined : true}
        className={`absolute top-0 left-3 -translate-y-1/2 bg-background px-1.5 text-sm transition-colors group-hover:text-accent ${active ? "text-accent" : "text-muted"}`}
      >
        {name}
      </Label>
      {children}
    </Container>
  );
}
