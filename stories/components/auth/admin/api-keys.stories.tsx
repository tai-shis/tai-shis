import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import ApiKeys from "@/app/components/auth/admin/api-keys";
import { apiKeys } from "./fixtures";

const NEW_SECRET = "Hx7aQexampleexampleexampleexampleexample";

const meta = {
  title: "Sections/Auth/Admin/ApiKeys",
  component: ApiKeys,
  args: {
    keys: apiKeys,
    loadError: null,
    onCreate: fn(async (): Promise<string | null> => NEW_SECRET),
    onRevoke: fn(async () => true),
  },
} satisfies Meta<typeof ApiKeys>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = { args: { keys: null } };

export const Empty: Story = { args: { keys: [] } };

export const LoadFailed: Story = {
  args: { keys: null, loadError: "Unable to load API keys. Reopen the dialog to try again." },
};

export const NameRequired: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "[create key]" }));
    const input = canvas.getByLabelText("name");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription("Enter a name for the key.");
    await expect(args.onCreate).not.toHaveBeenCalled();
  },
};

export const Created: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("name"), "laptop-cli");
    await userEvent.click(canvas.getByRole("button", { name: "[create key]" }));
    await expect(args.onCreate).toHaveBeenCalledWith("laptop-cli");
    await expect(await canvas.findByText(NEW_SECRET)).toBeInTheDocument();
    await expect(canvas.getByText("Copy this key now. It won't be shown again.")).toBeInTheDocument();
  },
};

export const CreateFailed: Story = {
  args: { onCreate: fn(async (): Promise<string | null> => null) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("name"), "laptop-cli");
    await userEvent.click(canvas.getByRole("button", { name: "[create key]" }));
    await expect(await canvas.findByText("Unable to create the key. Try again.")).toBeInTheDocument();
  },
};

export const RevokeConfirm: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole("button", { name: "[revoke]" })[0]);
    await userEvent.click(canvas.getByRole("button", { name: "[revoke laptop-cli]" }));
    await expect(args.onRevoke).toHaveBeenCalledWith("k1");
  },
};

export const RevokeFailed: Story = {
  args: { onRevoke: fn(async () => false) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole("button", { name: "[revoke]" })[0]);
    await userEvent.click(canvas.getByRole("button", { name: "[revoke laptop-cli]" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Unable to revoke laptop-cli. Try again.");
  },
};

export const RefreshFailed: Story = {
  args: { loadError: "Unable to load API keys. Reopen the dialog to try again." },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toBeInTheDocument();
    await expect(canvas.getByText("laptop-cli")).toBeInTheDocument();
  },
};
