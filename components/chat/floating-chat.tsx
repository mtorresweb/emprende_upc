"use client";

import { type FormEvent, useState } from "react";
import { Bot, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "intro", role: "assistant", content: "Hola, ¿en qué te ayudo sobre Emprende UPC?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.error || "No se pudo responder");
      const reply = (data as any).reply || "No tengo una respuesta en este momento.";
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
    } catch (err: any) {
      setError(err.message || "No se pudo responder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-60 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-xl backdrop-blur overflow-hidden">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Asistente</p>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mb-3 max-h-64 w-full space-y-2 overflow-y-auto overflow-x-hidden text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "rounded-lg px-3 py-2 max-w-full overflow-hidden",
                  m.role === "user" ? "bg-primary/10 text-foreground" : "bg-muted/70 text-foreground"
                )}
              >
                <span className="block text-xs font-semibold text-muted-foreground">
                  {m.role === "user" ? "Tú" : "Asistente"}
                </span>
                <span className="block whitespace-pre-wrap wrap-break-word leading-relaxed">{m.content}</span>
              </div>
            ))}
            {error && <p className="text-xs text-destructive">No se pudo responder. Intenta de nuevo.</p>}
          </div>
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <input
              className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm"
              placeholder="Pregunta algo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
            />
            <Button type="submit" size="sm" disabled={loading || !input.trim()}>
              {loading ? "..." : "Enviar"}
            </Button>
          </form>
        </div>
      )}

      {!open && (
        <div
          className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 grid justify-center items-center hover:cursor-pointer"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir chat"
        >
          <Bot className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
