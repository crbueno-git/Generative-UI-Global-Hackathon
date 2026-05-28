import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";

export const runtime = "nodejs";

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(path.resolve(here, "../../../../../.."));

const DEFAULT_WAKE_WORDS = ["isaac", "isac", "isaque", "izaac", "isack", "isacc"];

function parseWakeWords(rawValue: string | undefined) {
  const parsed = rawValue
    ?.split(",")
    .map((wakeWord) => wakeWord.trim().toLowerCase())
    .filter(Boolean);

  return parsed && parsed.length > 0 ? parsed : DEFAULT_WAKE_WORDS;
}

export async function GET() {
  return Response.json({
    liveModel:
      process.env.NEXT_PUBLIC_GEMINI_LIVE_MODEL?.trim() ||
      process.env.GEMINI_LIVE_MODEL?.trim() ||
      "gemini-3.1-flash-live-preview",
    voiceName: process.env.NEXT_PUBLIC_GEMINI_LIVE_VOICE_NAME?.trim() || "Puck",
    languageCode: process.env.NEXT_PUBLIC_GEMINI_LIVE_LANGUAGE_CODE?.trim() || "pt-BR",
    wakeWords: parseWakeWords(process.env.NEXT_PUBLIC_GEMINI_WAKE_WORDS),
  });
}
