import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import AuthDialogView from "@/app/components/auth/auth-dialog-view";
import ApiKeys from "@/app/components/auth/admin/api-keys";
import UsersList from "@/app/components/auth/admin/users-list";
import { apiKeys, manyAdminUsers } from "./admin/fixtures";

const meta = {
  title: "Sections/Auth/AuthDialogView",
  component: AuthDialogView,
  args: {
    account: null,
    isPending: false,
    onSignIn: fn(async () => true),
    onSignOut: fn(async () => true),
  },
} satisfies Meta<typeof AuthDialogView>;

export default meta;
type Story = StoryObj<typeof meta>;

async function openDialog(canvasElement: HTMLElement) {
  await userEvent.click(within(canvasElement).getByRole("button"));
  return screen.findByRole("dialog");
}

export const Loading: Story = {
  args: { isPending: true },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button");
    await expect(trigger).toHaveTextContent("[...]");
    await expect(trigger).toHaveAttribute("aria-busy", "true");
  },
};

export const SignedOut: Story = {
  play: async ({ canvasElement, args }) => {
    await expect(within(canvasElement).getByRole("button")).toHaveTextContent("[login]");
    const dialog = await openDialog(canvasElement);
    await expect(dialog).toHaveAccessibleName("Log in");
    await userEvent.click(within(dialog).getByRole("button", { name: /sign in with github/ }));
    await expect(args.onSignIn).toHaveBeenCalledOnce();
  },
};

export const SignInFailed: Story = {
  args: { onSignIn: fn(async () => false) },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);
    await userEvent.click(within(dialog).getByRole("button", { name: /sign in with github/ }));
    await expect(await within(dialog).findByRole("alert")).toHaveTextContent("Unable to start GitHub sign-in. Try again.");
    await expect(within(dialog).getByRole("button", { name: /sign in with github/ })).toBeEnabled();
  },
};

export const SignedIn: Story = {
  args: { account: { username: "tai-shis" } },
  play: async ({ canvasElement, args }) => {
    await expect(within(canvasElement).getByRole("button")).toHaveTextContent("[tai-shis]");
    const dialog = await openDialog(canvasElement);
    await expect(dialog).toHaveAccessibleName("Account");
    await expect(dialog).toHaveTextContent("Signed in as @tai-shis");
    await userEvent.click(within(dialog).getByRole("button", { name: "[sign out]" }));
    await expect(args.onSignOut).toHaveBeenCalledOnce();
  },
};

export const SignOutFailed: Story = {
  args: { account: { username: "tai-shis" }, onSignOut: fn(async () => false) },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);
    await userEvent.click(within(dialog).getByRole("button", { name: "[sign out]" }));
    await expect(await within(dialog).findByRole("alert")).toHaveTextContent("Unable to sign out. Try again.");
  },
};

export const LongUsername: Story = {
  // GitHub usernames max out at 39 characters.
  args: { account: { username: "a-very-long-github-username-at-the-max1" } },
  play: async ({ canvasElement }) => {
    await openDialog(canvasElement);
  },
};

export const SignedInAsAdmin: Story = {
  args: {
    account: { username: "tai-shis" },
    children: (
      <>
        <ApiKeys keys={apiKeys} loadError={null} onCreate={fn(async () => null)} onRevoke={fn(async () => true)} />
        <UsersList users={manyAdminUsers} loadError={null} currentUserId="bulk-0" onSetRole={fn(async () => true)} />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);
    const apiKeysHeading = within(dialog).getByRole("heading", { name: "api keys" });
    const usersHeading = within(dialog).getByRole("heading", { name: "users" });
    await expect(apiKeysHeading.compareDocumentPosition(usersHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await expect(dialog.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight * 0.8 + 1);
    await expect(dialog.scrollHeight).toBeGreaterThan(dialog.clientHeight);
  },
};
