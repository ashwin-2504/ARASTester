import * as StorageService from "./StorageService";
import { getTestPlansFldrPath } from "../ipc/appSettings";
import { generateTestId } from "@/lib/idGenerator";
import type { TestPlan, Test } from "@/types/plan";

export async function getFolderPath(): Promise<string | null> {
  return await getTestPlansFldrPath();
}

export async function getPlans(): Promise<TestPlan[]> {
  const folder = await getFolderPath();
  if (!folder) return [];

  try {
    const files = await StorageService.listJsonFiles(folder);

    const results = await mapConcurrent(files, 20, async (f): Promise<TestPlan | null> => {
      try {
        const raw = await StorageService.readFile(folder, f);
        let json: unknown;
        try {
          json = JSON.parse(raw);
        } catch (parseError: unknown) {
          const msg =
            parseError instanceof Error
              ? parseError.message
              : String(parseError);
          console.warn(`Skipping invalid JSON file: ${f} - ${msg}`);
          return null;
        }

        // Basic schema validation could go here, for now we cast safely-ish
        if (typeof json === "object" && json !== null) {
          const filename = f.replace(/\\/g, "/").split("/").pop();
          return { ...(json as TestPlan), __id: f, __filename: filename };
        }
        return null;
      } catch (err: unknown) {
        console.error("Failed reading plan", f, err);
        return null;
      }
    });

    const plans = results.filter((p): p is TestPlan => p !== null);

    plans.sort((a, b) =>
      (b.updated || b.created || "").localeCompare(a.updated || a.created || ""),
    );
    return plans;
  } catch (error: unknown) {
    console.error("Error listing plans:", error);
    return [];
  }
}

async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  const workers = new Array(Math.min(concurrency, items.length))
    .fill(null)
    .map(async () => {
      while (index < items.length) {
        const i = index++;
        results[i] = await fn(items[i]);
      }
    });

  await Promise.all(workers);
  return results;
}

export async function createPlan(title: string, description: string): Promise<TestPlan> {
  const folder = await getFolderPath();
  if (!folder) throw new Error("No test plan folder set.");

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomStr = "";
  for (let i = 0; i < 12; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const fileName = `${randomStr}.json`;

  const payload: TestPlan = {
    title: title || "New Test Plan",
    description: description || "",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    testPlan: [
      {
        testID: generateTestId(),
        testTitle: "Setup",
        isEnabled: true,
        testActions: [],
      } as Test,
    ],
    profiles: [],
  };

  await StorageService.writeFile(folder, fileName, payload);
  return { ...payload, __id: fileName, __filename: fileName };
}

export async function getPlan(filename: string): Promise<TestPlan> {
  const folder = await getFolderPath();
  if (!folder) throw new Error("No folder set");

  const filePath = filename;
  const raw = await StorageService.readFile(folder, filePath);

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Invalid JSON in test plan "${filename}": ${error.message}`,
      );
    }
    throw error;
  }
  
  if (typeof data !== 'object' || data === null) {
      throw new Error(`Invalid test plan format in "${filename}"`);
  }

  return { ...(data as TestPlan), __id: filePath, __filename: filename };
}

export async function updatePlan(filename: string, data: Partial<TestPlan>): Promise<TestPlan> {
  const folder = await getFolderPath();
  if (!folder) throw new Error("No folder set");
  const filePath = filename;

  const current = await getPlan(filename);

  const merged: TestPlan = {
    ...current,
    ...data,
    updated: new Date().toISOString(),
  };

  delete merged.__id;
  delete merged.__filename;

  await StorageService.writeFile(folder, filePath, merged);
  return { ...merged, __id: filePath, __filename: filename };
}

export async function deletePlan(filename: string): Promise<void> {
  const folder = await getFolderPath();
  if (!folder) throw new Error("No folder set");
  const filePath = filename;
  await StorageService.deleteFile(folder, filePath);
}
