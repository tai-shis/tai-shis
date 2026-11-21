import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import AiUsage from "@/app/components/admin/ai-usage";

const meta = {
  title: "Sections/Admin/AiUsage",
  component: AiUsage,
  args: { ingestUsd: 0.1234, ingestCapUsd: 1, chatUsd: 0.0123, chatCapUsd: 0.3 },
} satisfies Meta<typeof AiUsage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("ingest $0.12/$1.00")).not.toHaveClass("text-accent");
    await expect(canvas.getByText("chat $0.01/$0.30")).toBeInTheDocument();
  },
};

export const UnderACent: Story = {
  args: { chatUsd: 0.0004 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("chat <$0.01/$0.30")).toBeInTheDocument();
  },
};

export const NearCap: Story = {
  args: { ingestUsd: 0.85 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("ingest $0.85/$1.00")).toHaveClass("text-accent");
  },
};

export const AtCap: Story = {
  args: { chatUsd: 0.31 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("chat $0.31/$0.30")).toHaveClass("text-destructive");
  },
};
