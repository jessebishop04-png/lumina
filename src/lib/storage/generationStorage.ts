import type { GenerationJob } from "@/lib/types/generation";
import { openDB, STORES } from "./db";

export async function saveGenerationJob(job: GenerationJob): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORES.generations, "readwrite");
    tx.objectStore(STORES.generations).put(job);
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
  });
}

export async function getGenerationJobs(): Promise<GenerationJob[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.generations, "readonly");
    const request = tx.objectStore(STORES.generations).getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const jobs = (request.result as GenerationJob[]).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      resolve(jobs);
    };
    tx.oncomplete = () => db.close();
  });
}

export async function deleteGenerationJob(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORES.generations, "readwrite");
    tx.objectStore(STORES.generations).delete(id);
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
  });
}
