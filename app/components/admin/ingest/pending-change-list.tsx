"use client";

import { useState } from "react";
import Panel from "@/app/components/panel";
import { actionClass } from "@/app/components/auth/action-class";
import PendingChangeItem from "@/app/components/admin/ingest/pending-change-item";
import type { PendingChange, PendingChangeActions } from "@/app/lib/ingestion/types";

export type PendingChangeListProps = {
  changes: PendingChange[];
  actions: PendingChangeActions;
};

export default function PendingChangeList({ changes, actions }: PendingChangeListProps) {
  return (
    <Panel name={`pending (${changes.length})`} className="p-4 flex flex-col gap-3">
      {changes.length > 1 && <BulkReview ids={changes.map((change) => change.id)} actions={actions} />}
      {changes.length === 0 ? (
        <p className="px-2 text-sm text-muted">Nothing waiting for review. Proposals from the chat above show up here.</p>
      ) : (
        <ul className="flex flex-col gap-3 text-sm">
          {changes.map((change) => (
            <PendingChangeItem
              key={change.id}
              change={change}
              onApprove={(values) => actions.approve(change.id, values)}
              onReject={() => actions.reject(change.id)}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

type BulkAction = "approve" | "reject";

const BULK_BUSY_LABEL: Record<BulkAction, string> = { approve: "[approving...]", reject: "[rejecting...]" };

/** [approve all] and [reject all]. Each asks once more first, since either one settles every proposal at once. */
function BulkReview({ ids, actions }: { ids: string[]; actions: PendingChangeActions }) {
  const [confirming, setConfirming] = useState<BulkAction | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: BulkAction) => {
    setError(null);
    setIsBusy(true);
    const result = await (action === "approve" ? actions.approveAll(ids) : actions.rejectAll(ids));
    setIsBusy(false);
    setConfirming(null);
    if (!result.ok) setError(result.error);
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 px-2 text-sm">
      {error && <p role="alert" className="mr-auto text-destructive">{error}</p>}
      {confirming ? (
        <>
          <button
            type="button"
            onClick={() => run(confirming)}
            disabled={isBusy}
            className={`${actionClass} ${confirming === "reject" ? "hover:text-destructive" : ""}`}
          >
            {isBusy ? BULK_BUSY_LABEL[confirming] : `[${confirming} all ${ids.length}?]`}
          </button>
          <button type="button" onClick={() => setConfirming(null)} disabled={isBusy} className={actionClass}>
            [cancel]
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={() => setConfirming("approve")} className={actionClass}>
            [approve all]
          </button>
          <button type="button" onClick={() => setConfirming("reject")} className={`${actionClass} hover:text-destructive`}>
            [reject all]
          </button>
        </>
      )}
    </div>
  );
}
