import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import ProfileTablePanel from "@/app/components/admin/profile/profile-table-panel";
import { createProfileRowActions, experienceRows, longTitleRow, qaRows } from "./fixtures";

const meta = {
  title: "Sections/Admin/Profile/ProfileTablePanel",
  component: ProfileTablePanel,
  args: {
    table: "experience",
    rows: [...experienceRows, longTitleRow],
    actions: createProfileRowActions(),
  },
} satisfies Meta<typeof ProfileTablePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithRows: Story = {};

export const Empty: Story = { args: { rows: [] } };

export const Grilling: Story = { args: { table: "qa", rows: qaRows } };

export const Adding: Story = {
  args: { actions: createProfileRowActions() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "[add role]" }));
    await userEvent.type(canvas.getByRole("textbox", { name: "role" }), "Developer");
    await userEvent.type(canvas.getByRole("textbox", { name: "company" }), "Acme");
    await userEvent.click(canvas.getByRole("button", { name: "[add role]" }));
    await expect(args.actions.create).toHaveBeenCalledWith("experience", expect.objectContaining({ role: "Developer" }));
    await expect(canvas.queryByRole("textbox", { name: "role" })).not.toBeInTheDocument();
  },
};

export const RowActionsTargetTheRow: Story = {
  args: { actions: createProfileRowActions() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole("button", { name: /^\[hide/ })[0]);
    await expect(args.actions.setVisibility).toHaveBeenCalledWith("experience", experienceRows[0].id, false);
  },
};
