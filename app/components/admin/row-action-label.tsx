/**
 * A bracketed button label that names its row for screen readers, so a list of [edit] buttons
 * reads as "edit Developer @ Acme". One wrapping span keeps it a single flex item, so the
 * button's gap never splits it.
 */
export default function RowActionLabel({ action, rowTitle }: { action: string; rowTitle: string }) {
  return (
    <span>
      [{action}<span className="sr-only"> {rowTitle}</span>]
    </span>
  );
}
