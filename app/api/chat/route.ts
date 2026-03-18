import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const systemPrompt = `Eres un asistente de Emprende UPC.
Responde en español, con frases breves y claras.
Contexto del sitio:
- Home (/): explica la plataforma y CTA a explorar proyectos.
- Emprendimientos (/emprendimientos, /emprendimientos/[id]): ver proyectos publicados.
- Formación (/formacion): módulos en PDF/PPTX.
- Panel (/panel): publicar y gestionar emprendimientos.
- Registro (/registro) y Login (/login).
- Recuperar contraseña (/reset).
Si no sabes algo, dilo con honestidad y ofrece ir a la sección más cercana.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
    }

    const chatMessages: ChatCompletionMessageParam[] = messages
      .map((m: { role?: string; content?: string }) => ({ role: m.role, content: m.content }))
      .filter((m): m is ChatCompletionMessageParam =>
        typeof m.role === "string" && typeof m.content === "string" && m.content.trim().length > 0
      );

    if (chatMessages.length === 0) {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...chatMessages,
      ],
      max_tokens: 400,
    });

    const reply = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("chat error", err);
    const status = err?.status === 429 ? 429 : 500;
    const message = status === 429 ? "Límite alcanzado, intenta en unos minutos." : "No se pudo procesar el chat";
    return NextResponse.json({ error: message }, { status });
  }
}
