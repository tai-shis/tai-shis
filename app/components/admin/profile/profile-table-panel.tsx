"use client";

import { useState } from "react";
import Panel from "@/app/components/panel";
import { actionClass } from "@/app/components/auth/action-class";
import ProfileRowForm from "@/app/components/admin/profile/profile-row-form";
import ProfileRowItem from "@/app/components/admin/profile/profile-row-item";
import {
  getEmptyFormValues,
  profileTables,
  type ProfileFormValues,
  type ProfileRow,
  type ProfileRowActions,
  type ProfileTableKey,
} from "@/app/lib/profile/tables";

export type ProfileTablePanelProps = {
  table: ProfileTableKey;
  rows: ProfileRow[];
  actions: ProfileRowActions;
};

export default function ProfileTablePanel({ table, rows, actions }: ProfileTablePanelProps) {
  const config = profileTables[table];
  const [isAdding, setIsAdding] = useState(false);
  const addLabel = `add ${config.itemLabel}`;

  const handleCreate = async (values: ProfileFormValues) => {
    const result = await actions.create(table, values);
    if (result.ok) setIsAdding(false);
    return result;
  };

  return (
    <Panel name={config.label} className="p-4 flex flex-col gap-4">
      {isAdding ? (
        <ProfileRowForm
          fields={config.fields}
          initialValues={getEmptyFormValues(config.fields)}
          submitLabel={addLabel}
          onSubmit={handleCreate}
          onCancel={() => setIsAdding(false)}
        />
      ) : (
        <button onClick={() => setIsAdding(true)} className={`${actionClass} self-start`}>[{addLabel}]</button>
      )}
      {rows.length === 0 ? (
        <p className="text-sm text-muted px-2">Nothing here yet. Use [{addLabel}] to add the first one.</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {rows.map((row) => (
            <ProfileRowItem
              key={row.id}
              row={row}
              config={config}
              onUpdate={(values) => actions.update(table, row.id, values)}
              onDelete={() => actions.remove(table, row.id)}
              onSetVisibility={(visible) => actions.setVisibility(table, row.id, visible)}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}
