const DB_NAME = "lumina-editor";
const DB_VERSION = 4;

export const STORES = {
  projects: "projects",
  summaries: "project-summaries",
  generations: "generations",
  explorePosts: "explore-posts",
} as const;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const tx = (event.target as IDBOpenDBRequest).transaction!;

      if (!db.objectStoreNames.contains(STORES.projects)) {
        db.createObjectStore(STORES.projects, { keyPath: "id" });
      }

      let summaryStore: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORES.summaries)) {
        summaryStore = db.createObjectStore(STORES.summaries, { keyPath: "id" });
      } else {
        summaryStore = tx.objectStore(STORES.summaries);
      }

      if (!db.objectStoreNames.contains(STORES.generations)) {
        db.createObjectStore(STORES.generations, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORES.explorePosts)) {
        const exploreStore = db.createObjectStore(STORES.explorePosts, { keyPath: "id" });
        exploreStore.createIndex("sourceKey", "sourceKey", { unique: true });
      }

      if (event.oldVersion < 2) {
        const projectStore = tx.objectStore(STORES.projects);
        const cursorReq = projectStore.openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor) {
            const project = cursor.value;
            summaryStore.put({
              id: project.id,
              name: project.name,
              updatedAt: project.updatedAt,
              thumbnailDataUrl: project.images[0]?.thumbnailDataUrl ?? null,
              imageCount: project.images.length,
            });
            cursor.continue();
          }
        };
      }
    };
  });
}
