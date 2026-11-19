import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import AnimatedText from "@/app/components/animated-text";

const meta = {
  title: "Composites/AnimatedText",
  component: AnimatedText,
  args: { text: "shipping" },
  decorators: [(Story) => <p className="text-sm text-muted"><Story /></p>],
} satisfies Meta<typeof AnimatedText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Typewriter: Story = { args: { intro: "typewriter" } };

export const Scan: Story = { args: { intro: "scan" } };

export const LongText: Story = {
  args: { intro: "scan", text: "a-very-long-github-username-at-the-max1" },
};
