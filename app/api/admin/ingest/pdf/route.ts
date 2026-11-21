import { auth } from "@/app/lib/auth";
import { readPdf } from "@/app/lib/ingestion/pdf";
import { MAX_PDF_BYTES } from "@/app/lib/ingestion/types";

export const maxDuration = 30;

// Room for the multipart boundary and headers around the file.
const MAX_REQUEST_BYTES = MAX_PDF_BYTES + 64 * 1024;

function textResponse(status: number, message: string): Response {
  return new Response(message, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

const tooLarge = () => textResponse(413, `PDFs can be up to ${MAX_PDF_BYTES / 1024 / 1024} MB.`);

/** Reads the text out of an uploaded PDF. Nothing is stored until it's sent in the chat. */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session?.user.role !== "admin") return textResponse(404, "Not found.");

  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES) return tooLarge();

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    file = null;
  }
  if (!(file instanceof File)) return textResponse(400, "Choose a PDF to upload.");
  if (file.size > MAX_PDF_BYTES) return tooLarge();

  const result = await readPdf(new Uint8Array(await file.arrayBuffer()), file.name);
  if (!result.ok) return textResponse(422, result.error);
  return Response.json(result.pdf);
}
