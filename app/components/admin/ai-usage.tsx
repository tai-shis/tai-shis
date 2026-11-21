export type AiUsageProps = {
  ingestUsd: number;
  ingestCapUsd: number;
  chatUsd: number;
  chatCapUsd: number;
};

// From here a meter turns to the accent color, as a warning before the cap stops replies.
const WARN_RATIO = 0.8;

function formatUsd(value: number): string {
  if (value > 0 && value < 0.01) return "<$0.01";
  return `$${value.toFixed(2)}`;
}

function Meter({ label, used, cap }: { label: string; used: number; cap: number }) {
  const ratio = used / cap;
  const tone = ratio >= 1 ? "text-destructive" : ratio >= WARN_RATIO ? "text-accent" : undefined;
  return (
    <span className={tone}>
      {label} {formatUsd(used)}/{formatUsd(cap)}
    </span>
  );
}

/** Today's AI spend (UTC day) against each daily cap, for the admin footer. */
export default function AiUsage({ ingestUsd, ingestCapUsd, chatUsd, chatCapUsd }: AiUsageProps) {
  return (
    <p aria-label="AI spend today" title="AI spend today (UTC), against each daily cap" className="whitespace-nowrap text-xs">
      <span className="text-muted">ai </span>
      <Meter label="ingest" used={ingestUsd} cap={ingestCapUsd} />
      <span className="text-muted" aria-hidden="true"> · </span>
      <Meter label="chat" used={chatUsd} cap={chatCapUsd} />
    </p>
  );
}
