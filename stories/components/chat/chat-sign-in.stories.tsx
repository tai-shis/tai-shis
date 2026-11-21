import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import ChatSignIn from "@/app/components/chat/chat-sign-in";

const meta = {
  title: "Sections/Chat/ChatSignIn",
  component: ChatSignIn,
  args: { onSignIn: fn(async () => true) },
} satisfies Meta<typeof ChatSignIn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Sign in with GitHub to start. Chats are logged.")).toBeInTheDocument();
    const button = canvas.getByRole("button", { name: "[sign in with github]" });
    await userEvent.click(button);
    await expect(args.onSignIn).toHaveBeenCalled();
    await expect(button).toBeDisabled();
  },
};

export const SignInFailed: Story = {
  args: { onSignIn: fn(async () => false) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "[sign in with github]" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Unable to start GitHub sign-in. Try again.");
    await expect(canvas.getByRole("button", { name: "[sign in with github]" })).toBeEnabled();
  },
};
