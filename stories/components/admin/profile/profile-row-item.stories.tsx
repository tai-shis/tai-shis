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

export const Visible: Story = {};

export const Hidden: Story = { args: { row: experienceRows[1] } };

export const LongTitle: Story = { args: { row: longTitleRow } };

export const Hides: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^\[hide/ }));
    await expect(args.onSetVisibility).toHaveBeenCalledWith(false);
  },
};

export const Shows: Story = {
  args: { row: experienceRows[1] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^\[show/ }));
    await expect(args.onSetVisibility).toHaveBeenCalledWith(true);
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
