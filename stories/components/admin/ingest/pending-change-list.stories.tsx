import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import PendingChangeList from "@/app/components/admin/ingest/pending-change-list";
import type { PendingChange } from "@/app/lib/ingestion/types";
import type { ProfileMutationResult } from "@/app/lib/profile/tables";

const position = {
  role: "Developer Intern",
  company: "Acme",
  location: "Calgary, AB",
  startDate: "05-2025",
  endDate: "08-2025",
  summary: "Built internal dashboards in React.",
  highlights: "Cut load time in half\nAdded tests",
};

const createChange: PendingChange = {
  id: "00000000-0000-4000-8000-0000000000c1",
  table: "experience",
  action: "create",
  values: position,
  current: null,
  reason: 'Tai said: "I was a developer intern at Acme."',
  status: "pending",
};

const updateChange: PendingChange = {
  id: "00000000-0000-4000-8000-0000000000c2",
  table: "experience",
  action: "update",
  values: { ...position, endDate: "09-2025", location: "" },
  current: position,
  reason: "The internship ended in September.",
  status: "pending",
};

const deleteChange: PendingChange = {
  id: "00000000-0000-4000-8000-0000000000c3",
  table: "hobbies",
  action: "delete",
  values: {},
  current: { name: "Climbing", description: "Most weekends." },
  reason: "Duplicate of Bouldering.",
  status: "pending",
};

const orphanedUpdate: PendingChange = { ...updateChange, id: "00000000-0000-4000-8000-0000000000c4", current: null };

const succeed = async (): Promise<ProfileMutationResult> => ({ ok: true });

const meta = {
  title: "Sections/Admin/Ingest/PendingChangeList",
  component: PendingChangeList,
  args: {
    changes: [createChange, updateChange, deleteChange],
    actions: { approve: fn(succeed), approveAll: fn(succeed), reject: fn(succeed), rejectAll: fn(succeed) },
  },
} satisfies Meta<typeof PendingChangeList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { changes: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Nothing waiting for review/)).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "[reject all]" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "[approve all]" })).not.toBeInTheDocument();
  },
};

export const RejectsAll: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "[reject all]" }));
    // A second click confirms, so one slip can't throw away every proposal.
    await expect(args.actions.rejectAll).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole("button", { name: "[reject all 3?]" }));
    await expect(args.actions.rejectAll).toHaveBeenCalledWith([createChange.id, updateChange.id, deleteChange.id]);
  },
};

export const ApprovesAll: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "[approve all]" }));
    await expect(args.actions.approveAll).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole("button", { name: "[approve all 3?]" }));
    await expect(args.actions.approveAll).toHaveBeenCalledWith([createChange.id, updateChange.id, deleteChange.id]);
  },
};

export const ApproveAllPartlyFailed: Story = {
  args: {
    actions: {
      approve: fn(succeed),
      approveAll: fn(async () => ({ ok: false as const, error: "Approved 2 of 3. The one left couldn't be saved." })),
      reject: fn(succeed),
      rejectAll: fn(succeed),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "[approve all]" }));
    await userEvent.click(canvas.getByRole("button", { name: "[approve all 3?]" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Approved 2 of 3.");
  },
};

export const CancelsRejectAll: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "[reject all]" }));
    await userEvent.click(canvas.getByRole("button", { name: "[cancel]" }));
    await expect(canvas.getByRole("button", { name: "[reject all]" })).toBeInTheDocument();
    await expect(args.actions.rejectAll).not.toHaveBeenCalled();
  },
};

export const Mixed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "pending (3)" })).toBeInTheDocument();
    await expect(canvas.getByText("Cut load time in half; Added tests")).toBeInTheDocument();
    // The update shows only what changes, old value first.
    await expect(canvas.getByText("08-2025", { selector: "del" })).toBeInTheDocument();
    await expect(canvas.getByText("09-2025", { selector: "ins" })).toBeInTheDocument();
    await expect(canvas.getByText("Calgary, AB", { selector: "del" })).toBeInTheDocument();
    await expect(canvas.getByText("(empty)", { selector: "ins" })).toBeInTheDocument();
    // A delete can't be edited.
    await expect(canvas.queryByRole("button", { name: /^\[edit delete hobby/ })).not.toBeInTheDocument();
  },
};

export const Approves: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /^\[approve add position/ }));
    await expect(args.actions.approve).toHaveBeenCalledWith(createChange.id, undefined);
  },
};

export const ApprovesWithEdits: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^\[edit add position/ }));
    const company = canvas.getByRole("textbox", { name: /^company/ });
    await userEvent.clear(company);
    await userEvent.type(company, "Acme Inc.");
    await userEvent.click(canvas.getByRole("button", { name: "[approve]" }));
    await expect(args.actions.approve).toHaveBeenCalledWith(createChange.id, expect.objectContaining({ company: "Acme Inc." }));
    await expect(canvas.queryByRole("textbox", { name: /^company/ })).not.toBeInTheDocument();
  },
};

export const Rejects: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /^\[reject delete hobby/ }));
    await expect(args.actions.reject).toHaveBeenCalledWith(deleteChange.id);
  },
};

export const ApproveFailed: Story = {
  args: {
    changes: [createChange],
    actions: {
      approve: fn(async () => ({ ok: false as const, error: "This proposal was already handled. Reload the page." })),
      approveAll: fn(succeed),
      reject: fn(succeed),
      rejectAll: fn(succeed),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^\[approve add position/ }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("This proposal was already handled.");
  },
};

export const RowNoLongerExists: Story = {
  args: { changes: [orphanedUpdate] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("The entry this changes no longer exists. Reject it.")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /^\[approve/ })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /^\[reject/ })).toBeEnabled();
  },
};
