export type TrainingResource = {
  label: string;
  path: string; // relative to public
};

export type TrainingCategory = {
  category: string;
  description?: string;
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
  description?: string;
  dir?: string; // directory inside "modulos de formacion"
  files: string[]; // file names inside the directory (or root if dir is empty)
};

// Static manifest keeps serverless bundle small (avoids tracing the entire public folder).
const catalogDefinition: CategoryDefinition[] = [
  {
    category: "COMERCIO ELECTRÓNICO",
    description: "Aprende a crear, gestionar y optimizar tiendas en línea para vender productos o servicios a través de internet. Este módulo aborda conceptos clave como plataformas e-commerce, métodos de pago digitales, logística de envíos y estrategias para aumentar las ventas en entornos digitales.",
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
    description: "Desarrolla habilidades para gestionar adecuadamente los recursos financieros de tu emprendimiento. Incluye temas como costos, presupuestos, flujo de caja, fijación de precios y toma de decisiones financieras que permitan la sostenibilidad del negocio.",
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
    description: "Conoce estrategias para promocionar tu negocio en medios digitales. Este módulo enseña el uso de redes sociales, publicidad online, branding, creación de contenido y herramientas digitales para atraer clientes y posicionar tu emprendimiento en el mercado.",
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
    description: "Aprende a estructurar y definir tu idea de emprendimiento mediante herramientas como el modelo Canvas. Este módulo te ayudará a identificar tu propuesta de valor, clientes, canales, fuentes de ingresos y recursos clave para convertir tu idea en un negocio viable.",
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
  return catalogDefinition.map(({ category, description, dir, files }) => {
    const prefix = dir ? `modulos de formacion/${dir}/` : "modulos de formacion/";
    const resources: TrainingResource[] = files.map((file) => ({
      label: prettifyName(file),
      path: `${prefix}${file}`,
    }));
    return { category, description, resources };
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
