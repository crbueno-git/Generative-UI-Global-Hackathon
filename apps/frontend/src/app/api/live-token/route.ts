import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(path.resolve(here, "../../../../../.."));

const LIVE_MODEL =
  process.env.GEMINI_LIVE_MODEL?.trim() ||
  process.env.NEXT_PUBLIC_GEMINI_LIVE_MODEL?.trim() ||
  "gemini-3.1-flash-live-preview";

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Defina GEMINI_API_KEY ou GOOGLE_GEMINI_API_KEY para habilitar o Gemini Live." },
      { status: 500 },
    );
  }

  try {
    const now = Date.now();
    const expireTime = new Date(now + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(now + 60 * 1000).toISOString();

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1alpha" },
    });

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
      },
    });

    const tokenValue = (token as { token?: string; name?: string }).token ?? token.name;

    if (!tokenValue) {
      throw new Error("Nao foi possivel emitir token efemero.");
    }

    return Response.json({ token: tokenValue, model: LIVE_MODEL });
  } catch (error) {
    return Response.json(
      { error: "Falha ao criar token efemero para o Gemini Live." },
      { status: 500 },
    );
  }
}
