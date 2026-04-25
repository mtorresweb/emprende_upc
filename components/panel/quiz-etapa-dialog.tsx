"use client";
import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


const preguntas = [
  {
    pregunta: (
      <>
        <span className="text-xs text-muted-foreground">Selecciona la opción que mejor describa tu situación actual.</span>
      </>
    ),
    opciones: [
      { label: "Solo tengo una idea o problema identificado", etapa: "IDEA" },
      { label: "Tengo un prototipo o maqueta, pero nadie lo ha usado todavía", etapa: "PROTOTYPE" },
      { label: "Ya probé mi producto/servicio con personas reales (aunque sea en pequeño)", etapa: "MVP" },
      { label: "Ya tengo clientes o usuarios frecuentes y quiero crecer", etapa: "GROWTH" },
    ],
  },
];

const etapaLabel: Record<string, string> = {
  IDEA: "Idea",
  PROTOTYPE: "Prototipo",
  MVP: "MVP",
  GROWTH: "Crecimiento",
};

export function QuizEtapaDialog() {
  const [open, setOpen] = useState(false);

  const [etapa, setEtapa] = useState<string | null>(null);

  const handleRespuesta = (etapa: string) => {
    setEtapa(etapa);
  };

  const handleRestart = () => {
    setEtapa(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex w-full justify-end mb-2">
        <DialogTrigger asChild>
          <Button variant="outline" type="button">Empezar quiz</Button>
        </DialogTrigger>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle asChild>
            <h2 className="text-lg font-semibold mb-2 uppercase">¿EN QUÉ ETAPA ESTÁ TU PROYECTO?</h2>
          </DialogTitle>
        </DialogHeader>
        {etapa ? (
          <div className="space-y-4">
            <div className="text-center text-base">
              Según tu respuesta, tu proyecto está en la etapa:
              <span className="block mt-2 text-2xl font-bold text-primary">{etapaLabel[etapa]}</span>
            </div>
            <Button onClick={() => { setOpen(false); handleRestart(); }} className="w-full" variant="secondary">Cerrar</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-base text-foreground mb-4">{preguntas[0].pregunta}</div>
            <div className="flex flex-col gap-3">
              {preguntas[0].opciones.map((op) => (
                <Button key={op.etapa} onClick={() => handleRespuesta(op.etapa)} className="w-full" variant="outline">
                  {op.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
