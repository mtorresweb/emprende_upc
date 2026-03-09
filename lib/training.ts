export type TrainingResource = {
  label: string;
  path: string; // relative to public
};

export type TrainingCategory = {
  category: string;
  resources: TrainingResource[];
};

function prettifyName(fileName: string) {
  const withoutExt = fileName.replace(/\.[^/.]+$/, "");
  return withoutExt
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type CategoryDefinition = {
  category: string;
  dir?: string; // directory inside "modulos de formacion"
  files: string[]; // file names inside the directory (or root if dir is empty)
};

// Static manifest keeps serverless bundle small (avoids tracing the entire public folder).
const catalogDefinition: CategoryDefinition[] = [
  {
    category: "Comercio Electrónico",
    dir: "Comercio Electrónico",
    files: [
      "Actividades-Practicas-Comercio-Electronico.pptx.pdf",
      "Introduccion-al-Comercio-Electronico.pptx.pdf",
      "Unidad-2-Creacion-de-la-Presencia-Online.pptx.pdf",
      "Unidad-3-Estrategias-de-Ventas-Digitales.pptx.pdf",
      "Unidad-4Medios-de-Pago-y-Logistica.pptx.pdf",
      "Unidad-5-Marketing-Digital-para-el-E-commerce.pptx.pdf",
      "Unidad-6-Gestion-y-Crecimiento-del-Negocio-Online.pptx.pdf",
    ],
  },
  {
    category: "Finanzas para Emprendedores",
    dir: "Finanzas para Emprendedores",
    files: [
      "Actividades-finales-de-los-modulo.pptx.pdf",
      "Unidad-1-Introduccion-a-las-Finanzas-para-Emprendedores.pptx.pdf",
      "Unidad-2-Control-de-Ingresos-y-Gastos.pptx.pdf",
      "Unidad-3-Presupuesto-Empresarial.pptx.pdf",
      "Unidad-4-Flujo-de-Caja.pptx.pdf",
      "Unidad-5-Fuentes-de-Financiamiento-para-Emprendedores.pptx.pdf",
      "Unidad-6-Indicadores-Financieros-Basicos.pptx.pdf",
      "unidad-7-Buenas-Practicas-Financieras.pptx.pdf",
    ],
  },
  {
    category: "Marketing Digital para Emprendimientos",
    dir: "Marketing Digital para Emprendimientos",
    files: [
      "Actividades-Propuestas.pptx.pdf",
      "Introduccion-al-Marketing-Digital.pptx.pdf",
      "UNIDAD-2-IDENTIDAD-Y-PRESENCIA-DIGITAL.pptx.pdf",
      "UNIDAD-3-Estrategias-y-Herramientas-Digitales.pptx.pdf",
      "UNIDAD-4-Creacion-de-Contenido-Digital.pptx.pdf",
      "Unidad-5-Analitica-y-Medicion-de-Resultados-en-Marketing-Digital.pptx.pdf",
    ],
  },
  {
    category: "Modelos de Negocio",
    dir: "Modelos de Negocio",
    files: [
      "Introduccion-a-los-Modelos-de-Negocio.pptx.pdf",
      "Unidad-2-Herramientas-para-disenar-modelos-de-negocio.pptx.pdf",
      "Unidad-3-Innovacion-y-Tendencias-en-Modelos-de-Negocio.pptx.pdf",
      "Unidad-4-Validacion-de-Modelos-de-Negocio.pptx.pdf",
      "Unidad-5-Presentacion-y-Comunicacion-del-Modelo-de-Negocio.pptx.pdf",
      "actividades propuesta Modelos-de-Negocio.pptx.pdf",
    ],
  },
  {
    category: "General",
    files: ["Mentalidad_Innovadora_Presentacion_Creativa.pptx"],
  },
];

function buildCatalog(): TrainingCategory[] {
  return catalogDefinition.map(({ category, dir, files }) => {
    const prefix = dir ? `modulos de formacion/${dir}/` : "modulos de formacion/";
    const resources: TrainingResource[] = files.map((file) => ({
      label: prettifyName(file),
      path: `${prefix}${file}`,
    }));
    return { category, resources };
  });
}

export const trainingCatalog: TrainingCategory[] = buildCatalog();

const trainingPathSet = new Set(trainingCatalog.flatMap((cat) => cat.resources.map((r) => r.path)));

export async function getTrainingCatalog(): Promise<TrainingCategory[]> {
  return trainingCatalog;
}

export function isValidTrainingPath(resourcePath: string) {
  return trainingPathSet.has(resourcePath);
}
