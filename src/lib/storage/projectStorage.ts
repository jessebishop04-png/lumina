import type { Project, ProjectSummary } from "@/lib/types";
import { openDB, STORES } from "./db";

const STORAGE_KEY = "lumina-projects";

export function projectToSummary(project: Project): ProjectSummary {
  const cover = project.images[0];
  return {
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt,
    thumbnailDataUrl: cover?.thumbnailDataUrl ?? null,
    previewDataUrl: cover?.previewDataUrl ?? cover?.thumbnailDataUrl ?? null,
    imageCount: project.images.length,
  };
}

export async function saveProject(project: Project): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORES.projects, STORES.summaries], "readwrite");
    const projectStore = tx.objectStore(STORES.projects);
    const summaryStore = tx.objectStore(STORES.summaries);

    projectStore.put(project);
    summaryStore.put(projectToSummary(project));

    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
  });
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.projects, "readonly");
    const store = tx.objectStore(STORES.projects);
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result ?? null);
    tx.oncomplete = () => db.close();
  });
}

export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.summaries, "readonly");
    const store = tx.objectStore(STORES.summaries);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const summaries = (request.result as ProjectSummary[]).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      resolve(summaries);
    };
    tx.oncomplete = () => db.close();
  });
}

/** Loads full project records — use only when you need image data. */
export async function getAllProjects(): Promise<Project[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.projects, "readonly");
    const store = tx.objectStore(STORES.projects);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const projects = (request.result as Project[]).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      resolve(projects);
    };
    tx.oncomplete = () => db.close();
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.projects, STORES.summaries], "readwrite");
    tx.objectStore(STORES.projects).delete(id);
    tx.objectStore(STORES.summaries).delete(id);
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
  });
}

export function saveRecentProjectIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, 10)));
}

export function getRecentProjectIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentProject(id: string): void {
  const recent = getRecentProjectIds().filter((pid) => pid !== id);
  recent.unshift(id);
  saveRecentProjectIds(recent);
}
