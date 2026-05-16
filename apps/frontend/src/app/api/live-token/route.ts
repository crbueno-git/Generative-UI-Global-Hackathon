import { GoogleGenAI } from "@google/genai";

const LIVE_MODEL = "gemini-3.1-flash-live-preview";

export const runtime = "nodejs";

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Defina GEMINI_API_KEY para habilitar o Gemini Live." },
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
    console.error("Erro ao criar token efemero Gemini Live", error);

    return Response.json(
      { error: "Falha ao criar token efemero para o Gemini Live." },
      { status: 500 },
    );
  }
}
