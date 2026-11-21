import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import ChatView, { type ChatEntry } from "@/app/components/chat/chat-view";

const conversation: ChatEntry[] = [
  { id: "1", role: "user", text: "What are you working on right now?" },
  {
    id: "2",
    role: "assistant",
    text: "Mostly Stoa, a private communication platform I'm building with TypeScript and Rust. I'm also finishing my degree at Mount Royal.",
  },
  { id: "3", role: "user", text: "What do you do outside of school?" },
  {
    id: "4",
    role: "assistant",
    text: "Mechanical keyboards, music, photography, and cooking.\nI'd like to get into homelabbing too.",
  },
];

function turns(count: number): ChatEntry[] {
  return Array.from({ length: count }, (_, i) => [
    { id: `u${i}`, role: "user" as const, text: `Question ${i + 1}?` },
    { id: `a${i}`, role: "assistant" as const, text: `Answer ${i + 1}.` },
  ]).flat();
}

const meta = {
  title: "Sections/Chat/ChatView",
  component: ChatView,
  decorators: [
    (Story) => (
      <div className="h-[480px]">
        <Story />
      </div>
    ),
  ],
  args: {
    messages: [],
    status: "ready",
    error: null,
    canRetry: false,
    remainingToday: undefined,
    onSend: fn(),
    onStop: fn(),
    onRetry: fn(),
    onNewChat: fn(),
  },
} satisfies Meta<typeof ChatView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("10 messages a day.")).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "[new chat]" })).not.toBeInTheDocument();
  },
};

export const Conversation: Story = {
  args: { messages: conversation, remainingToday: 8 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("8 messages left today.")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "[Which project are you proudest of?]" }));
    await expect(args.onSend).toHaveBeenCalledWith("Which project are you proudest of?");
  },
};

export const Admin: Story = {
  args: { messages: conversation, remainingToday: null },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText(/left today|a day/)).not.toBeInTheDocument();
  },
};

export const Waiting: Story = {
  args: { messages: conversation.slice(0, 3), status: "submitted", remainingToday: 8 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("log")).toHaveAttribute("aria-busy", "true");
    await expect(canvas.getByText("...")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "[new chat]" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "[What are you working on right now?]" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "[stop]" }));
    await expect(args.onStop).toHaveBeenCalled();
  },
};

export const SendsWithEnter: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Message" });
    await expect(canvas.getByRole("button", { name: "[send]" })).toBeDisabled();
    await userEvent.type(input, "  Hi there  {Enter}");
    await expect(args.onSend).toHaveBeenCalledWith("Hi there");
    await expect(input).toHaveValue("");
  },
};

export const ShiftEnterAddsLine: Story = {
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Message" });
    await userEvent.type(input, "one{Shift>}{Enter}{/Shift}two");
    await expect(input).toHaveValue("one\ntwo");
    await expect(args.onSend).not.toHaveBeenCalled();
  },
};

export const PicksSuggestion: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "[What are you working on right now?]" }));
    await expect(args.onSend).toHaveBeenCalledWith("What are you working on right now?");
  },
};

export const CountsCharacters: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Message" });
    await expect(input).toHaveAttribute("maxlength", "500");
    await userEvent.type(input, "hello");
    await expect(input).toHaveAccessibleDescription("5/500");
  },
};

export const OutOfMessages: Story = {
  args: { messages: conversation, remainingToday: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("That's all 10 messages for today. Come back tomorrow.")).toBeInTheDocument();
    await expect(canvas.queryByRole("textbox")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("list", { name: "Suggested questions" })).not.toBeInTheDocument();
  },
};

export const ChatFull: Story = {
  args: { messages: turns(10), remainingToday: null },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("This chat reached 10 messages. Start a new chat to keep going.")).toBeInTheDocument();
    await expect(canvas.queryByRole("textbox")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "[new chat]" }));
    await expect(args.onNewChat).toHaveBeenCalled();
  },
};

export const FailedWithRetry: Story = {
  args: { messages: conversation.slice(0, 3), status: "error", error: "Something went wrong. Try again.", canRetry: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("Something went wrong. Try again.");
    await userEvent.click(canvas.getByRole("button", { name: "[retry]" }));
    await expect(args.onRetry).toHaveBeenCalled();
  },
};

export const LimitError: Story = {
  args: {
    messages: conversation.slice(0, 3),
    status: "error",
    error: "You've used today's 10 messages. Come back tomorrow.",
    canRetry: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("You've used today's 10 messages.");
    await expect(canvas.queryByRole("button", { name: "[retry]" })).not.toBeInTheDocument();
  },
};
