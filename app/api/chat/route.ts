import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Gemini client picks up GEMINI_API_KEY from env; still allow explicit
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const systemPrompt = `Eres un asistente de Emprende UPC.
- Idioma: responde siempre en español, breve y directo.
- Alcance: SOLO usa esta información; no inventes datos ni nombres propios nuevos.
  - Home (/): qué es la plataforma y CTA a explorar proyectos.
  - Emprendimientos (/emprendimientos, /emprendimientos/[id]): ver proyectos publicados y detalles.
  - Formación (/formacion): módulos en PDF/PPTX.
  - Panel (/panel): publicar y gestionar emprendimientos (subir info, adjuntar materiales).
  - Registro (/registro) y Login (/login): crear cuenta o iniciar sesión.
  - Recuperar contraseña (/reset): flujo de restablecimiento por correo.
- Si la pregunta NO está cubierta por esto, responde literalmente: "No tengo esa info en la plataforma. Puedo guiarte a la sección más cercana: /emprendimientos, /formacion, /panel, /registro, /login o /reset." No añadas nada más.
- Si te piden datos concretos (fechas, correos, programas, incubadoras) y no están en el listado, di que no los tienes.
- Responde en 3-5 oraciones máximo o viñetas breves.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
    }

    const chatMessages = messages
      .map((m: { role?: string; content?: string }) => ({ role: m.role, content: m.content }))
      .filter(
        (m): m is { role: "user" | "assistant"; content: string } =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      );

    if (chatMessages.length === 0) {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    const modelIdRaw = process.env.GEMINI_MODEL_ID || "gemini-3-flash-preview";
    const modelId = modelIdRaw.startsWith("models/") ? modelIdRaw : `models/${modelIdRaw}`;

    const completion = await client.models.generateContent({
      model: modelId,
      contents: chatMessages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        maxOutputTokens: 300,
        temperature: 0.1,
        topP: 0.8,
        responseMimeType: "text/plain",
      },
    });

    const reply = (() => {
      if (typeof completion.text === "string") return completion.text;
      const parts = completion.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        return parts
          .map((p: any) => p?.text)
          .filter((t: any): t is string => typeof t === "string")
          .join("\n");
      }
      return "";
    })();

    if (!reply.trim()) {
      return NextResponse.json({ error: "No se pudo generar respuesta" }, { status: 502 });
    }

    return NextResponse.json({ reply, model: modelId });
  } catch (err: any) {
    console.error("chat error", err);
    const status = err?.status === 429 ? 429 : 500;
    const message = status === 429 ? "Límite alcanzado, intenta en unos minutos." : "No se pudo procesar el chat";
    return NextResponse.json({ error: message }, { status });
  }
}
