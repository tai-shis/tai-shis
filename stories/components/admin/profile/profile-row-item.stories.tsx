import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import ProfileRowItem from "@/app/components/admin/profile/profile-row-item";
import { profileTables, type ProfileMutationResult } from "@/app/lib/profile/tables";
import { experienceRows, longTitleRow, SAVE_FAILED } from "./fixtures";

const succeed = async (): Promise<ProfileMutationResult> => ({ ok: true });

const meta = {
  title: "Sections/Admin/Profile/ProfileRowItem",
  component: ProfileRowItem,
  decorators: [
    (Story) => (
      <ul className="flex flex-col gap-2 text-sm">
        <Story />
      </ul>
    ),
  ],
  args: {
    row: experienceRows[0],
    config: profileTables.experience,
    onUpdate: fn(succeed),
    onDelete: fn(succeed),
    onSetVisibility: fn(succeed),
  },
} satisfies Meta<typeof ProfileRowItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Public: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Every filled field shows without opening the form.
    await expect(canvas.getByText("Calgary, AB")).toBeInTheDocument();
    await expect(canvas.getByText("Built reporting pipelines for vendor data.")).toBeInTheDocument();
    await expect(canvas.getByText("Cut report generation time in half")).toBeInTheDocument();
    await expect(canvas.getByText("Migrated cron jobs to queues")).toBeInTheDocument();
    await expect(canvas.queryByRole("textbox")).not.toBeInTheDocument();
  },
};

export const Private: Story = {
  args: { row: experienceRows[1] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("(private)")).toBeInTheDocument();
    // Empty fields are left out.
    await expect(canvas.queryByText("location")).not.toBeInTheDocument();
  },
};

export const LongTitle: Story = { args: { row: longTitleRow } };

export const MakesPrivate: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^\[private/ }));
    await expect(args.onSetVisibility).toHaveBeenCalledWith(false);
  },
};

export const MakesPublic: Story = {
  args: { row: experienceRows[1] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^\[public/ }));
    await expect(args.onSetVisibility).toHaveBeenCalledWith(true);
  },
};

export const Collapses: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^\[hide/ }));
    await expect(canvas.queryByText("Calgary, AB")).not.toBeInTheDocument();
    // Hiding only folds the details away here: the row stays public.
    await expect(args.onSetVisibility).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole("button", { name: /^\[show/ }));
    await expect(canvas.getByText("Calgary, AB")).toBeInTheDocument();
  },
};

export const Editing: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^\[edit/ }));
    const titleInput = canvas.getByRole("textbox", { name: "title" });
    await expect(titleInput).toHaveValue("Software Developer Intern");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Developer");
    await userEvent.click(canvas.getByRole("button", { name: "[save]" }));
    await expect(args.onUpdate).toHaveBeenCalledWith(expect.objectContaining({ role: "Developer" }));
    await expect(canvas.queryByRole("textbox", { name: "title" })).not.toBeInTheDocument();
  },
};

export const ConfirmDelete: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^\[delete/ }));
    await userEvent.click(canvas.getByRole("button", { name: "[delete position]" }));
    await expect(args.onDelete).toHaveBeenCalled();
  },
};

export const DeleteFailed: Story = {
  args: { onDelete: fn(async () => SAVE_FAILED) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^\[delete/ }));
    await userEvent.click(canvas.getByRole("button", { name: "[delete position]" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Unable to save the change. Try again.");
  },
};
