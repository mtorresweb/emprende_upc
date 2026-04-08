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
    .replace(/_\d{8}_\d{6}_\d{4}$/, "") // strip Canva-style timestamps
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
    category: "COMERCIO ELECTRÓNICO",
    dir: "comercio electrónico",
    files: [
      "Unidad 1 Introduccion al Comercio Electronico_20260331_104024_0000.pdf",
      "Unidad 2 Creacion de la Presencia Online._20260331_104536_0000.pdf",
      "Unidad 3 Estrategias de Ventas Digitales._20260331_104917_0000.pdf",
      "Unidad 4 Medios de Pago y Logistica._20260331_105159_0000.pdf",
      "Unidad 5 Marketing Digital para el E-commerce_20260331_105550_0000.pdf",
      "Unidad 6 Gestion y Crecimiento del Negocio Online._20260331_110404_0000.pdf",
      "Actividades Practicas Comercio Electronico._20260331_110205_0000.pdf",
    ],
  },
  {
    category: "FINANZAS PARA EMPRENDEDORES",
    dir: "Finanzas para Emprendedores",
    files: [
      "Unidad-1-Introduccion-a-las-Finanzas-para-Emprendedores.pptx.pdf",
      "Unidad-2-Control-de-Ingresos-y-Gastos.pptx.pdf",
      "Unidad-3-Presupuesto-Empresarial.pptx.pdf",
      "Unidad-4-Flujo-de-Caja.pptx.pdf",
      "Unidad-5-Fuentes-de-Financiamiento-para-Emprendedores.pptx.pdf",
      "Unidad-6-Indicadores-Financieros-Basicos.pptx.pdf",
      "unidad-7-Buenas-Practicas-Financieras.pptx.pdf",
      "Actividades-finales-de-los-modulo.pptx.pdf",
    ],
  },
  {
    category: "MARKETING DIGITAL PARA EMPRENDIMIENTOS",
    dir: "Marketing Digital para Emprendimientos",
    files: [
      "Introduccion-al-Marketing-Digital.pptx.pdf",
      "UNIDAD-2-IDENTIDAD-Y-PRESENCIA-DIGITAL.pptx.pdf",
      "UNIDAD-3-Estrategias-y-Herramientas-Digitales.pptx.pdf",
      "UNIDAD-4-Creacion-de-Contenido-Digital.pptx.pdf",
      "Unidad-5-Analitica-y-Medicion-de-Resultados-en-Marketing-Digital.pptx.pdf",
      "Actividades-Propuestas.pptx.pdf",
    ],
  },
  {
    category: "MODELOS DE NEGOCIO",
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
    category: "RECURSOS Y OPORTUNIDADES (COLOMBIA)",
    dir: "Recursos Colombia",
    files: ["Fuentes-y-eventos-Colombia.html"],
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
