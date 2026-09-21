import { randomVerb } from "@/app/lib/verbs";

// Any "{{verb}}" in a curl string is swapped for a fresh, bolded verb.
export function fillVerb(text: string): string {
  return text.replace(/\{\{verb\}\}/g, () => `**${randomVerb()}**`);
}
