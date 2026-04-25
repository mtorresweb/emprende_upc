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
  dir?: string; // directory inside "modulo de formacion final"
  files: string[]; // file names inside the directory (or root if dir is empty)
};

// Static manifest keeps serverless bundle small (avoids tracing the entire public folder).
const catalogDefinition: CategoryDefinition[] = [
  {
    category: "COMERCIO ELECTRÓNICO",
    description: "Aprende a crear, gestionar y optimizar tiendas en línea para vender productos o servicios a través de internet. Este módulo aborda conceptos clave como plataformas e-commerce, métodos de pago digitales, logística de envíos y estrategias para aumentar las ventas en entornos digitales.",
    dir: "Comercio Electrónico",
    files: [
      "Unidad 1Introduccion al Comercio Electronico.pdf",
      "Unidad 2 Creacion de la Presencia Online..pdf",
      "Unidad 3 Estrategias de Ventas Digitales..pdf",
      "Unidad 4 Medios de Pago y Logistica..pdf",
      "Unidad 5 Marketing Digital para el E-commerce.pdf",
      "Unidad 6 Gestion y Crecimiento del Negocio Online..pdf",
      "Actividades Practicas Comercio Electronico..pdf",
    ],
  },
  {
    category: "FINANZAS PARA EMPRENDEDORES",
    description: "Desarrolla habilidades para gestionar adecuadamente los recursos financieros de tu emprendimiento. Incluye temas como costos, presupuestos, flujo de caja, fijación de precios y toma de decisiones financieras que permitan la sostenibilidad del negocio.",
    dir: "Finanzas para Emprendedores",
    files: [
      "Unidad 1 Introduccion a las Finanzas para Emprendedores..pdf",
      "Unidad 2 Control de Ingresos y Gastos..pdf",
      "Unidad 3 Presupuesto Empresarial..pdf",
      "Unidad 4 Flujo de Caja..pdf",
      "Unidad 5 Fuentes de Financiamiento para Emprendedores..pdf",
      "Unidad 6 Indicadores Financieros Basicos..pdf",
      "unidad 7 Buenas Practicas Financieras..pdf",
      "Actividades finales de los modulo..pdf",
    ],
  },
  {
    category: "MARKETING DIGITAL PARA EMPRENDIMIENTOS",
    description: "Conoce estrategias para promocionar tu negocio en medios digitales. Este módulo enseña el uso de redes sociales, publicidad online, branding, creación de contenido y herramientas digitales para atraer clientes y posicionar tu emprendimiento en el mercado.",
    dir: "Marketing Digital para Emprendimientos",
    files: [
      "Unidad 1 Introduccion al Marketing Digital..pdf",
      "UNIDAD 2 IDENTIDAD Y PRESENCIA DIGITAL..pdf",
      "UNIDAD 3 Estrategias y Herramientas Digitales..pdf",
      "UNIDAD 4 Creación de Contenido Digital..pdf",
      "Unidad 5 Analítica y Medición de Resultados en Marketing Digital..pdf",
      "Actividades Propuestas..pdf",
    ],
  },
  {
    category: "MODELOS DE NEGOCIO",
    description: "Aprende a estructurar y definir tu idea de emprendimiento mediante herramientas como el modelo Canvas. Este módulo te ayudará a identificar tu propuesta de valor, clientes, canales, fuentes de ingresos y recursos clave para convertir tu idea en un negocio viable.",
    dir: "Modelos de Negocio",
    files: [
      "Unidad 1 Introduccion a los Modelos de Negocio..pdf",
      "Unidad 2 Herramientas para diseñar modelos de negocio..pdf",
      "Unidad 3 Innovación y Tendencias en Modelos de Negocio..pdf",
      "Unidad 4 Validacion de Modelos de Negocio..pdf",
      "Unidad 5 Presentacion y Comunicacion del Modelo de Negocio..pdf",
      "Actividades propuesta Modelos de Negocio..pdf",
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
    const prefix = dir ? `modulo de formacion final/${dir}/` : "modulo de formacion final/";
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
