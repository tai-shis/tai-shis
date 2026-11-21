import { extractText, getDocumentProxy } from "unpdf";
import { z } from "zod";
import { MAX_PDF_PAGES, MAX_PDF_TEXT_CHARS, type PdfAttachment } from "@/app/lib/ingestion/types";

const MAX_FILENAME_CHARS = 200;
// Less text than this means a scanned PDF: the pages are images.
const MIN_TEXT_CHARS = 20;

export const pdfAttachmentSchema = z.object({
  filename: z.string().min(1).max(MAX_FILENAME_CHARS),
  pages: z.number().int().min(1).max(MAX_PDF_PAGES),
  text: z.string().min(1).max(MAX_PDF_TEXT_CHARS),
  truncated: z.boolean(),
});

export type ReadPdfResult = { ok: true; pdf: PdfAttachment } | { ok: false; error: string };

const NOT_A_PDF = "That file couldn't be read as a PDF.";

function isPdf(bytes: Uint8Array): boolean {
  return new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
}

function toFilename(name: string): string {
  const base = name.split(/[\/]/).pop()?.trim() || "document.pdf";
  return base.slice(0, MAX_FILENAME_CHARS);
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function readPdf(bytes: Uint8Array, name: string): Promise<ReadPdfResult> {
  if (!isPdf(bytes)) return { ok: false, error: NOT_A_PDF };

  let document: Awaited<ReturnType<typeof getDocumentProxy>>;
  try {
    document = await getDocumentProxy(bytes);
  } catch {
    // Includes password-protected files.
    return { ok: false, error: NOT_A_PDF };
  }

  try {
    if (document.numPages > MAX_PDF_PAGES) {
      return { ok: false, error: `That PDF has ${document.numPages} pages. The limit is ${MAX_PDF_PAGES}.` };
    }
    const text = cleanText((await extractText(document, { mergePages: true })).text);
    if (text.length < MIN_TEXT_CHARS) {
      return { ok: false, error: "No text found in that PDF. If it's a scan, paste the text instead." };
    }
    const truncated = text.length > MAX_PDF_TEXT_CHARS;
    return {
      ok: true,
      pdf: { filename: toFilename(name), pages: document.numPages, text: truncated ? text.slice(0, MAX_PDF_TEXT_CHARS) : text, truncated },
    };
  } catch {
    return { ok: false, error: NOT_A_PDF };
  } finally {
    await document.loadingTask.destroy();
  }
}

/** How a PDF reads to the model, in place of the `data-pdf` part. */
export function describePdfForModel(pdf: PdfAttachment): string {
  const pages = `${pdf.pages} page${pdf.pages === 1 ? "" : "s"}`;
  const cutOff = pdf.truncated ? ` Only the first ${MAX_PDF_TEXT_CHARS.toLocaleString("en-US")} characters are included.` : "";
  return `Tai attached a PDF, "${pdf.filename}" (${pages}).${cutOff} Its extracted text:\n<pdf>\n${pdf.text}\n</pdf>`;
}
