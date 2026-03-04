import fs from "fs/promises";
import path from "path";

export type TrainingResource = {
  label: string;
  path: string; // relative to public
};

export type TrainingCategory = {
  category: string;
  resources: TrainingResource[];
};

const trainingRoot = path.join(process.cwd(), "public", "modulos de formacion");
const allowedExtensions = [".pdf", ".pptx", ".ppt", ".docx", ".pptx.pdf", ".ppt.pdf"]; // keep broad for provided assets

function prettifyName(fileName: string) {
  const withoutExt = fileName.replace(/\.[^/.]+$/, "");
  return withoutExt
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAllowedFile(file: string) {
  const lower = file.toLowerCase();
  return allowedExtensions.some((ext) => lower.endsWith(ext));
}

export async function getTrainingCatalog(): Promise<TrainingCategory[]> {
  const entries = await fs.readdir(trainingRoot, { withFileTypes: true });
  const categories: TrainingCategory[] = [];
  const looseFiles: TrainingResource[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const dirPath = path.join(trainingRoot, entry.name);
      const files = await fs.readdir(dirPath);
      const resources = files
        .filter(isAllowedFile)
        .map((file) => ({
          label: prettifyName(file),
          path: `modulos de formacion/${entry.name}/${file}`,
        }));

      if (resources.length > 0) {
        categories.push({ category: prettifyName(entry.name), resources });
      }
    } else if (entry.isFile() && isAllowedFile(entry.name)) {
      looseFiles.push({
        label: prettifyName(entry.name),
        path: `modulos de formacion/${entry.name}`,
      });
    }
  }

  if (looseFiles.length) {
    categories.push({ category: "General", resources: looseFiles });
  }

  return categories;
}
