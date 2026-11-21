"use client";

import Panel from "@/app/components/panel";
import PendingChangeItem from "@/app/components/admin/ingest/pending-change-item";
import type { PendingChange } from "@/app/lib/ingestion/types";
import type { ProfileFormValues, ProfileMutationResult } from "@/app/lib/profile/tables";

export type PendingChangeActions = {
  approve: (id: string, values?: ProfileFormValues) => Promise<ProfileMutationResult>;
  reject: (id: string) => Promise<ProfileMutationResult>;
};

export type PendingChangeListProps = {
  changes: PendingChange[];
  actions: PendingChangeActions;
};

export default function PendingChangeList({ changes, actions }: PendingChangeListProps) {
  return (
    <Panel name={`pending (${changes.length})`} className="p-4 flex flex-col gap-3">
      {changes.length === 0 ? (
        <p className="px-2 text-sm text-muted">Nothing waiting for review. Proposals from the ingest chat show up here.</p>
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
