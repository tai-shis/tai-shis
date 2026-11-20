import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import ProfileRowForm from "@/app/components/admin/profile/profile-row-form";
import { getEmptyFormValues, profileTables, type ProfileMutationResult } from "@/app/lib/profile/tables";
import { experienceRows, SAVE_FAILED } from "./fixtures";

const experienceFields = profileTables.experience.fields;

const meta = {
  title: "Composites/Admin/Profile/ProfileRowForm",
  component: ProfileRowForm,
  args: {
    fields: experienceFields,
    initialValues: getEmptyFormValues(experienceFields),
    submitLabel: "add role",
    onSubmit: fn(async (): Promise<ProfileMutationResult> => ({ ok: true })),
    onCancel: fn(),
  },
} satisfies Meta<typeof ProfileRowForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = {
  args: { initialValues: experienceRows[0].values, submitLabel: "save" },
};

export const QuestionAndAnswer: Story = {
  args: {
    fields: profileTables.qa.fields,
    initialValues: getEmptyFormValues(profileTables.qa.fields),
    submitLabel: "add answer",
  },
};

export const Submits: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", { name: "role" }), "Developer");
    await userEvent.type(canvas.getByRole("textbox", { name: "company" }), "Acme");
    await userEvent.click(canvas.getByRole("button", { name: "[add role]" }));
    await expect(args.onSubmit).toHaveBeenCalledWith(expect.objectContaining({ role: "Developer", company: "Acme" }));
  },
};

export const SubmitsWithCtrlEnter: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", { name: "summary" }), "Shipped things{Control>}{Enter}{/Control}");
    await expect(args.onSubmit).toHaveBeenCalledWith(expect.objectContaining({ summary: "Shipped things" }));
  },
};

export const FieldErrors: Story = {
  args: {
    onSubmit: fn(async (): Promise<ProfileMutationResult> => ({
      ok: false,
      error: "Fix the highlighted fields.",
      fieldErrors: { role: "Enter a role.", startDate: "Use the format YYYY-MM." },
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "[add role]" }));
    const roleInput = canvas.getByRole("textbox", { name: "role" });
    await expect(roleInput).toHaveAttribute("aria-invalid", "true");
    await expect(roleInput).toHaveAccessibleDescription("Enter a role.");
    await expect(roleInput).toHaveFocus();
    await expect(canvas.getByLabelText(/^start/)).toHaveAccessibleDescription("Format: YYYY-MM. Use the format YYYY-MM.");
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
  },
};

export const SaveFailed: Story = {
  args: { onSubmit: fn(async () => SAVE_FAILED) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "[add role]" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Unable to save the change. Try again.");
  },
};

export const Cancels: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "[cancel]" }));
    await expect(args.onCancel).toHaveBeenCalled();
  },
};
