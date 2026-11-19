import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import UsersList from "@/app/components/auth/admin/users-list";
import { adminUsers } from "./fixtures";

const meta = {
  title: "Sections/Auth/Admin/UsersList",
  component: UsersList,
  args: {
    users: adminUsers,
    loadError: null,
    currentUserId: "u1",
    onSetRole: fn(async () => true),
  },
} satisfies Meta<typeof UsersList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("(you)")).toBeInTheDocument();
    await expect(canvas.getAllByText("n/a")).toHaveLength(1);
    await userEvent.click(canvas.getAllByRole("button", { name: "[make admin]" })[0]);
    await expect(args.onSetRole).toHaveBeenCalledWith("u2", "admin");
  },
};

export const Loading: Story = { args: { users: null } };

export const Empty: Story = { args: { users: [] } };

export const LoadFailed: Story = {
  args: { users: null, loadError: "Unable to load users. Reopen the dialog to try again." },
};

export const RoleChangeFailed: Story = {
  args: { onSetRole: fn(async () => false) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole("button", { name: "[make admin]" })[0]);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Unable to change @octocat's role. Try again.");
  },
};
