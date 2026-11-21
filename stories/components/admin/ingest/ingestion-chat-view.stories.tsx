import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import IngestionChatView, { type IngestionEntry } from "@/app/components/admin/ingest/ingestion-chat-view";
import { toIngestionEntry } from "@/app/components/admin/ingest/to-ingestion-entry";
import type { IngestionUIMessage, PdfAttachment, PendingChange } from "@/app/lib/ingestion/types";

const resumePdf: PdfAttachment = {
  filename: "resume.pdf",
  pages: 2,
  text: "Developer Intern, Acme, 05-2025 to 08-2025",
  truncated: false,
};

const uiMessages: IngestionUIMessage[] = [
  {
    id: "u1",
    role: "user",
    parts: [
      { type: "data-pdf", data: resumePdf },
      { type: "text", text: "I was a developer intern at Acme from 05-2025 to 08-2025. I also climb." },
    ],
  },
  {
    id: "a1",
    role: "assistant",
    parts: [
      { type: "step-start" },
      { type: "tool-list_profile", toolCallId: "t1", state: "output-available", input: { table: "experience" }, output: { rows: [] } },
      {
        type: "tool-propose_create",
        toolCallId: "t2",
        state: "output-available",
        input: { table: "experience", values: { role: "Developer Intern", company: "Acme", startDate: "05-2025" } },
        output: { ok: true, pendingChangeId: "p1" },
      },
      {
        type: "tool-propose_create",
        toolCallId: "t3",
        state: "output-available",
        input: { table: "hobbies", values: { name: "Climbing" } },
        output: { ok: false, error: "description: Enter a description." },
      },
      {
        type: "tool-propose_update",
        toolCallId: "t4",
        state: "input-available",
        input: { table: "education", rowId: "x", values: { gpa: "3.9/4.0" } },
      },
      { type: "text", text: "I proposed your internship. What should the climbing description say?" },
    ],
  } as IngestionUIMessage,
];

const messages: IngestionEntry[] = uiMessages.map(toIngestionEntry);

const internship: PendingChange = {
  id: "p1",
  table: "experience",
  action: "create",
  values: {
    role: "Developer Intern",
    company: "Acme",
    location: "",
    startDate: "05-2025",
    endDate: "08-2025",
    summary: "",
    highlights: "",
  },
  current: null,
  reason: 'Tai said: "I was a developer intern at Acme."',
  status: "pending",
};

const meta = {
  title: "Sections/Admin/Ingest/IngestionChatView",
  component: IngestionChatView,
  decorators: [
    (Story) => (
      <div className="h-[600px]">
        <Story />
      </div>
    ),
  ],
  args: {
    messages: [],
    status: "ready",
    error: null,
    canRetry: false,
    changes: [],
    isLoadingChanges: false,
    upload: { status: "none" },
    onAttach: fn(),
    onRemoveAttachment: fn(),
    onGrill: fn(),
    onSend: fn(),
    onStop: fn(),
    onRetry: fn(),
    onNewSession: fn(),
  },
} satisfies Meta<typeof IngestionChatView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Paste a resume section/)).toBeInTheDocument();
    await expect(canvas.getByRole("textbox", { name: "Message" })).toBeEnabled();
    await expect(canvas.queryByRole("button", { name: "[new session]" })).not.toBeInTheDocument();
  },
};

export const WithSteps: Story = {
  args: { messages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("[pdf] resume.pdf · 2 pages")).toBeInTheDocument();
    await expect(canvas.getByText("read experience")).toBeInTheDocument();
    // Before the proposals load, a proposal shows as a plain step.
    await expect(canvas.getByText("proposed add position: Developer Intern @ Acme")).toBeInTheDocument();
    await expect(canvas.getByText("proposing add hobby: Climbing failed")).toBeInTheDocument();
    await expect(canvas.getByText(": description: Enter a description.")).toBeInTheDocument();
    await expect(canvas.getByText("proposing edit education (grade)")).toBeInTheDocument();
    // The reply is over, so a step still in progress was cut off.
    await expect(canvas.getByText(": didn't finish")).toBeInTheDocument();
  },
};

export const WaitingForReview: Story = {
  args: { messages, changes: [internship] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("waiting for review", { exact: false })).toBeInTheDocument();
    // The cards live in the pending panel, so the chat only points at them and waits.
    await expect(canvas.queryByRole("button", { name: /^\[approve/ })).not.toBeInTheDocument();
    await expect(canvas.getByRole("status")).toHaveTextContent("Review the proposal below to continue.");
    await expect(canvas.getByRole("textbox", { name: "Message" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "[send]" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "[attach pdf]" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "[grill me]" })).toBeDisabled();
  },
};

export const ReviewedProposal: Story = {
  args: { messages, changes: [{ ...internship, status: "approved" }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("· approved")).toBeInTheDocument();
    await expect(canvas.queryByRole("status")).not.toBeInTheDocument();
    await expect(canvas.getByRole("textbox", { name: "Message" })).toBeEnabled();
  },
};

export const LoadingProposals: Story = {
  args: { messages, isLoadingChanges: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("textbox", { name: "Message" })).toBeDisabled();
  },
};

export const Waiting: Story = {
  args: { messages: messages.slice(0, 1), status: "submitted" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("log")).toHaveAttribute("aria-busy", "true");
    await expect(canvas.getByText("ai › ...")).toBeInTheDocument();
    await expect(canvas.getByRole("textbox", { name: "Message" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "[new session]" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "[stop]" }));
    await expect(args.onStop).toHaveBeenCalled();
  },
};

export const StartsGrilling: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "[grill me]" }));
    await expect(args.onGrill).toHaveBeenCalled();
  },
};

export const SendsWithEnter: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Message" });
    await expect(input).toHaveAttribute("maxlength", "20000");
    await userEvent.type(input, "Line one{Shift>}{Enter}{/Shift}line two{Enter}");
    await expect(args.onSend).toHaveBeenCalledWith("Line one\nline two");
  },
};

export const StartsNewSession: Story = {
  args: { messages },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "[new session]" }));
    await expect(args.onNewSession).toHaveBeenCalled();
  },
};

export const FailedWithRetry: Story = {
  args: { messages: messages.slice(0, 1), status: "error", error: "Something went wrong. Try again.", canRetry: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("Something went wrong. Try again.");
    await userEvent.click(canvas.getByRole("button", { name: "[retry]" }));
    await expect(args.onRetry).toHaveBeenCalled();
  },
};

export const AttachesPdf: Story = {
  play: async ({ canvasElement, args }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')!;
    await expect(input).toHaveAttribute("accept", "application/pdf,.pdf");
    const file = new File(["%PDF-1.4"], "resume.pdf", { type: "application/pdf" });
    await userEvent.upload(input, file);
    await expect(args.onAttach).toHaveBeenCalledWith(file);
  },
};

export const ReadingPdf: Story = {
  args: { upload: { status: "reading", filename: "resume.pdf" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("reading resume.pdf...");
    await userEvent.type(canvas.getByRole("textbox", { name: "Message" }), "only the projects");
    await expect(canvas.getByRole("button", { name: "[send]" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "[attach pdf]" })).toBeDisabled();
  },
};

export const SendsPdfWithoutNote: Story = {
  args: { upload: { status: "ready", pdf: { ...resumePdf, truncated: true } } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/only the first 40,000 characters will be sent/)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "[send]" }));
    await expect(args.onSend).toHaveBeenCalledWith("");
  },
};

export const RemovesPdf: Story = {
  args: { upload: { status: "ready", pdf: resumePdf } },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "[remove]" }));
    await expect(args.onRemoveAttachment).toHaveBeenCalled();
  },
};

export const PdfFailed: Story = {
  args: { upload: { status: "failed", error: "No text found in that PDF. If it's a scan, paste the text instead." } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("No text found in that PDF.");
    // A failed PDF doesn't count as something to send.
    await expect(canvas.getByRole("button", { name: "[send]" })).toBeDisabled();
  },
};

export const SpendCapReached: Story = {
  args: { messages, status: "error", error: "Ingestion hit today's $1 limit. Try again tomorrow.", canRetry: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("Ingestion hit today's $1 limit.");
    await expect(canvas.queryByRole("button", { name: "[retry]" })).not.toBeInTheDocument();
  },
};
